-- Personal info table: name, occupation, gender, age, no_of_dependants, PAN
CREATE TABLE IF NOT EXISTS personal_info (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL UNIQUE,
  full_name         VARCHAR(255) NULL,
  occupation        VARCHAR(100) NULL,
  gender            VARCHAR(20) NULL,
  age               TINYINT UNSIGNED NULL,
  no_of_dependants  TINYINT UNSIGNED DEFAULT 0,
  pan_hash          VARCHAR(255) NULL,
  pan_masked        VARCHAR(10) NULL,
  pan_verified      TINYINT(1) DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
