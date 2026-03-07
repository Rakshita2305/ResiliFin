-- Demo database: same structure as main tables
-- Used when PAN verified - fetch demo data instead of manual input

-- 1. Demo profiles (savings: liquid, emergency, fds, rds)
CREATE TABLE IF NOT EXISTS demo_profiles (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scenario_name     VARCHAR(50) NOT NULL DEFAULT 'default',
  liquid_savings    DECIMAL(12,2) DEFAULT 0,
  emergency_funds   DECIMAL(12,2) DEFAULT 0,
  fds_amount        DECIMAL(12,2) DEFAULT 0,
  rds_amount        DECIMAL(12,2) DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NULL
);

-- 2. Demo loans (same structure as loans)
CREATE TABLE IF NOT EXISTS demo_loans (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  demo_profile_id   BIGINT UNSIGNED NOT NULL,
  loan_type         VARCHAR(100) NOT NULL,
  provider          VARCHAR(255) NOT NULL,
  principal_amount  DECIMAL(15,2) NOT NULL,
  interest_rate     DECIMAL(5,2) NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  monthly_due_day   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  yearly_due_date   DATE NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NULL,
  FOREIGN KEY (demo_profile_id) REFERENCES demo_profiles(id) ON DELETE CASCADE
);

-- 3. Demo investments (same structure as investments)
CREATE TABLE IF NOT EXISTS demo_investments (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  demo_profile_id   BIGINT UNSIGNED NOT NULL,
  investment_type   VARCHAR(100) NOT NULL,
  amount            DECIMAL(15,2) NOT NULL,
  platform          VARCHAR(255) NULL,
  expected_return   DECIMAL(5,2) NULL,
  start_date        DATE NULL,
  maturity_date     DATE NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NULL,
  FOREIGN KEY (demo_profile_id) REFERENCES demo_profiles(id) ON DELETE CASCADE
);

-- 4. Demo insurances (same structure as insurances)
CREATE TABLE IF NOT EXISTS demo_insurances (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  demo_profile_id   BIGINT UNSIGNED NOT NULL,
  insurance_type    VARCHAR(100) NOT NULL,
  provider          VARCHAR(255) NOT NULL,
  premium_amount    DECIMAL(12,2) NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NULL,
  FOREIGN KEY (demo_profile_id) REFERENCES demo_profiles(id) ON DELETE CASCADE
);

-- Seed default demo profile
INSERT INTO demo_profiles (scenario_name, liquid_savings, emergency_funds, fds_amount, rds_amount) VALUES
('default', 85000, 150000, 200000, 10000);

SET @demo_id = LAST_INSERT_ID();

INSERT INTO demo_loans (demo_profile_id, loan_type, provider, principal_amount, interest_rate, start_date, end_date, monthly_due_day) VALUES
(@demo_id, 'Home Loan', 'HDFC Bank', 3500000, 8.50, '2022-01-15', '2032-01-15', 5);

INSERT INTO demo_investments (demo_profile_id, investment_type, amount, platform, expected_return, start_date, maturity_date) VALUES
(@demo_id, 'Mutual Fund', 150000, 'Zerodha', 12.00, '2023-06-01', NULL),
(@demo_id, 'Mutual Fund SIP', 5000, 'Groww', 12.00, '2024-01-01', NULL),
(@demo_id, 'PPF', 250000, 'SBI', 7.10, '2020-04-01', '2035-04-01');

INSERT INTO demo_insurances (demo_profile_id, insurance_type, provider, premium_amount, start_date, end_date) VALUES
(@demo_id, 'Health Insurance', 'Star Health', 1800, '2023-01-01', '2024-12-31'),
(@demo_id, 'Term Insurance', 'HDFC Life', 1200, '2022-06-01', '2042-06-01');
