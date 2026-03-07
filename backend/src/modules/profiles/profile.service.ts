import { Types } from 'mongoose';

import { AuditLogModel } from '../audit/audit-log.model';
import { UserModel } from '../users/user.model';
import { ProfileModel } from './profile.model';
import {
  PROFILE_REQUIRED_FIELDS,
  ProfileCompletionStatus,
  ProfileRequiredField,
  UpsertProfileInput,
} from './profile.types';

const assertNonNegativeNumber = (value: unknown, field: string, strictPositive = false) => {
  if (value === undefined) {
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a valid number`);
  }
  if (strictPositive && value <= 0) {
    throw new Error(`${field} must be greater than 0`);
  }
  if (!strictPositive && value < 0) {
    throw new Error(`${field} must be non-negative`);
  }
};

const assertString = (value: unknown, field: string) => {
  if (value === undefined) {
    return;
  }
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
};

const validateInput = (input: UpsertProfileInput) => {
  assertString(input.fullName, 'fullName');
  assertString(input.occupation, 'occupation');
  assertString(input.location, 'location');

  if (input.age !== undefined && (!Number.isInteger(input.age) || input.age < 1 || input.age > 120)) {
    throw new Error('age must be an integer between 1 and 120');
  }

  if (
    input.familySize !== undefined &&
    (!Number.isInteger(input.familySize) || input.familySize < 1 || input.familySize > 20)
  ) {
    throw new Error('familySize must be an integer between 1 and 20');
  }

  if (input.preferredBanks !== undefined) {
    if (!Array.isArray(input.preferredBanks) || input.preferredBanks.some((value) => typeof value !== 'string')) {
      throw new Error('preferredBanks must be an array of strings');
    }
  }

  assertNonNegativeNumber(input.monthlySalaryApprox, 'monthlySalaryApprox', true);
  assertNonNegativeNumber(input.monthlyFixedExpense, 'monthlyFixedExpense');
  assertNonNegativeNumber(input.variableExpenseBaseline, 'variableExpenseBaseline');
  assertNonNegativeNumber(input.liquidSavings, 'liquidSavings');
  assertNonNegativeNumber(input.emergencyFund, 'emergencyFund');
  assertNonNegativeNumber(input.extendedSavingsTotal, 'extendedSavingsTotal');

  if (
    input.monthlyExpenseInputMode !== undefined &&
    !['approx', 'statement', 'hybrid'].includes(input.monthlyExpenseInputMode)
  ) {
    throw new Error('monthlyExpenseInputMode must be approx, statement, or hybrid');
  }

  if (input.statementUploadRecommended !== undefined && typeof input.statementUploadRecommended !== 'boolean') {
    throw new Error('statementUploadRecommended must be a boolean');
  }

  if (input.paymentSchedules !== undefined) {
    if (!Array.isArray(input.paymentSchedules)) {
      throw new Error('paymentSchedules must be an array');
    }

    input.paymentSchedules.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`paymentSchedules[${index}] must be an object`);
      }

      if (!['emi', 'bill', 'recharge', 'investment', 'insurance'].includes(item.kind)) {
        throw new Error(`paymentSchedules[${index}].kind is invalid`);
      }

      if (!Number.isInteger(item.dueDayOfMonth) || item.dueDayOfMonth < 1 || item.dueDayOfMonth > 31) {
        throw new Error(`paymentSchedules[${index}].dueDayOfMonth must be 1-31`);
      }

      if (item.amount !== undefined) {
        assertNonNegativeNumber(item.amount, `paymentSchedules[${index}].amount`);
      }

      if (item.autoPay !== undefined && typeof item.autoPay !== 'boolean') {
        throw new Error(`paymentSchedules[${index}].autoPay must be boolean`);
      }
    });
  }

  if (input.currency !== undefined && input.currency !== 'INR') {
    throw new Error('currency must be INR');
  }
};

const computeCompletion = (profile: {
  monthlySalaryApprox?: number;
  monthlyFixedExpense?: number;
  variableExpenseBaseline?: number;
}): ProfileCompletionStatus => {
  const missingFields: ProfileRequiredField[] = PROFILE_REQUIRED_FIELDS.filter((field) => {
    const value = profile[field];

    if (value === undefined || value === null) {
      return true;
    }

    if (field === 'monthlySalaryApprox') {
      return value <= 0;
    }

    return value < 0;
  });

  return {
    complete: missingFields.length === 0,
    missingFields,
  };
};

const toObjectId = (value: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error('Invalid user id');
  }
  return new Types.ObjectId(value);
};

export const getProfileByUserId = async (userId: string) => {
  const userObjectId = toObjectId(userId);
  return ProfileModel.findOne({ userId: userObjectId });
};

export const getProfileCompletionStatus = async (userId: string): Promise<ProfileCompletionStatus> => {
  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return {
      complete: false,
      missingFields: [...PROFILE_REQUIRED_FIELDS],
    };
  }

  return computeCompletion(profile);
};

export const upsertProfileByUserId = async (params: {
  userId: string;
  input: UpsertProfileInput;
  reasonTag?: string;
}) => {
  validateInput(params.input);

  const userObjectId = toObjectId(params.userId);

  const existing = await getProfileByUserId(params.userId);

  const nextProfile = await ProfileModel.findOneAndUpdate(
    { userId: userObjectId },
    {
      $set: {
        ...params.input,
      },
      $setOnInsert: {
        currency: 'INR',
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!nextProfile) {
    throw new Error('Unable to save profile');
  }

  const completion = computeCompletion(nextProfile);

  const userMirrorResult = await UserModel.updateOne(
    { _id: userObjectId },
    {
      $set: {
        fullName: nextProfile.fullName,
        occupation: nextProfile.occupation,
        location: nextProfile.location,
        familySize: nextProfile.familySize,
        monthlySalaryApprox: nextProfile.monthlySalaryApprox,
        variableExpenseBaseline: nextProfile.variableExpenseBaseline,
        onboardingCompleted: completion.complete,
      },
    },
  );

  if (userMirrorResult.matchedCount === 0) {
    throw new Error('Profile saved but user record was not found for mirror update');
  }

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'profile',
    entityId: nextProfile._id,
    action: existing ? 'update' : 'create',
    reasonTag: params.reasonTag,
    before: existing ? existing.toObject() : undefined,
    after: nextProfile.toObject(),
  });

  return nextProfile;
};
