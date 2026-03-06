import { Types } from 'mongoose';

import { AuditLogModel } from '../audit/audit-log.model';
import { StatementCycleModel } from './statement-cycle.model';
import { ScanSummary } from './statement-scan.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_CYCLES_TO_KEEP = 24;

const cap2 = (value: number) => Math.round(value * 100) / 100;

export const trackStatementUploadCycle = async (params: {
  userId: string;
  summary: ScanSummary;
  uploadedAt?: Date;
}) => {
  const uploadedAt = params.uploadedAt ?? new Date();

  const latest = await StatementCycleModel.findOne({ userId: params.userId }).sort({ lastUploadAt: -1 });
  const msSinceLast = latest ? uploadedAt.getTime() - latest.lastUploadAt.getTime() : null;
  const startsNewCycle = !latest || msSinceLast === null || msSinceLast > THIRTY_DAYS_MS;

  let cycle = latest;

  if (startsNewCycle || !cycle) {
    cycle = await StatementCycleModel.create({
      userId: new Types.ObjectId(params.userId),
      cycleStartAt: uploadedAt,
      lastUploadAt: uploadedAt,
      uploadCount: 1,
      totalOutflow: cap2(params.summary.totalOutflow),
      totalInflow: cap2(params.summary.totalInflow),
      estimatedMonthlyOutflow: cap2(params.summary.estimatedMonthlyOutflow),
      notes: 'New statement month started from upload date.',
    });
  } else {
    cycle.lastUploadAt = uploadedAt;
    cycle.uploadCount += 1;
    cycle.totalOutflow = cap2(cycle.totalOutflow + params.summary.totalOutflow);
    cycle.totalInflow = cap2(cycle.totalInflow + params.summary.totalInflow);
    cycle.estimatedMonthlyOutflow = cap2(cycle.totalOutflow);
    await cycle.save();
  }

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'statement_cycle',
    entityId: cycle._id,
    action: startsNewCycle ? 'create' : 'update',
    reasonTag: startsNewCycle ? 'statement-cycle-create' : 'statement-cycle-update',
    after: cycle.toObject(),
  });

  const allCycles = await StatementCycleModel.find({ userId: params.userId }).sort({ cycleStartAt: -1 });

  if (allCycles.length > MAX_CYCLES_TO_KEEP) {
    const overflow = allCycles.slice(MAX_CYCLES_TO_KEEP);
    const overflowIds = overflow.map((item) => item._id);

    await StatementCycleModel.deleteMany({ _id: { $in: overflowIds } });

    for (const oldCycle of overflow) {
      await AuditLogModel.create({
        userId: new Types.ObjectId(params.userId),
        entityType: 'statement_cycle',
        entityId: oldCycle._id,
        action: 'delete',
        reasonTag: 'statement-cycle-rotate-max-24',
        before: oldCycle.toObject(),
      });
    }
  }

  return {
    cycle,
    startsNewCycle,
    previousUploadAt: latest?.lastUploadAt,
    daysSinceLastUpload: msSinceLast === null ? null : Math.floor(msSinceLast / (24 * 60 * 60 * 1000)),
    retainedCycles: Math.min(allCycles.length, MAX_CYCLES_TO_KEEP),
    maxCycles: MAX_CYCLES_TO_KEEP,
  };
};

export const listStatementCycles = async (userId: string) => {
  return StatementCycleModel.find({ userId }).sort({ cycleStartAt: -1 }).limit(MAX_CYCLES_TO_KEEP);
};
