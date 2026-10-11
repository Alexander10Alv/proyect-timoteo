-- =====================================================
-- HeartCry Platform — Database Schema (MySQL 8 / XAMPP)
-- Base de datos: heartcry_db
-- Uso: mysql -u root heartcry_db < schema.sql
-- (o importa desde phpMyAdmin)
-- =====================================================

CREATE DATABASE IF NOT EXISTS heartcry_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE heartcry_db;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id              VARCHAR(191)     NOT NULL PRIMARY KEY,
    name            VARCHAR(255)     NOT NULL,
    email           VARCHAR(255)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)     NOT NULL,
    role            ENUM('ADMIN','VISITOR') NOT NULL DEFAULT 'VISITOR',
    country         VARCHAR(100)     NULL,
    created_at      DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
) ENGINE = InnoDB;

-- =====================================================
-- JOSHUA PROJECT — ESTRUCTURA COMPLETA (país → grupos → provincias → ministerios)
-- =====================================================

CREATE TABLE IF NOT EXISTS country (
    country_code             VARCHAR(2)   NOT NULL PRIMARY KEY,  -- ISO 2 letras, ej. "PE"
    country_name             VARCHAR(255) NOT NULL,
    total_people_groups      INT          NOT NULL DEFAULT 0,
    unreached_people_groups  INT          NOT NULL DEFAULT 0,
    unreached_pct            DOUBLE       NOT NULL DEFAULT 0,
    frontier_people_groups   INT          NOT NULL DEFAULT 0,
    frontier_pct             DOUBLE       NOT NULL DEFAULT 0,
    total_population         BIGINT       NOT NULL DEFAULT 0,
    unreached_population     BIGINT       NOT NULL DEFAULT 0,
    frontier_population      BIGINT       NOT NULL DEFAULT 0,
    christian_adherents_pct  DOUBLE       NOT NULL DEFAULT 0,
    evangelical_pct          DOUBLE       NOT NULL DEFAULT 0,
    flag_url                 VARCHAR(1000) NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS people_group (
    id                    VARCHAR(191) NOT NULL PRIMARY KEY,
    peop_code             VARCHAR(20)  NOT NULL UNIQUE,          -- ej. "PEJ01"
    country_code          VARCHAR(2)   NOT NULL,
    people_name           VARCHAR(255) NOT NULL,
    population_in_country INT          NOT NULL DEFAULT 0,
    population_global     BIGINT       NULL,
    is_unreached          BOOLEAN      NOT NULL DEFAULT FALSE,
    is_frontier           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_indigenous         BOOLEAN      NOT NULL DEFAULT FALSE,
    is_diaspora           BOOLEAN      NOT NULL DEFAULT FALSE,
    primary_language      VARCHAR(255) NOT NULL,
    primary_language_code VARCHAR(20)  NULL,
    primary_religion      VARCHAR(255) NOT NULL,
    evangelical_pct       DOUBLE       NULL,
    province_region       VARCHAR(255) NULL,
    description           TEXT         NULL,
    photo_url             TEXT         NULL,
    INDEX idx_pg_country   (country_code),
    INDEX idx_pg_unreached (is_unreached),
    CONSTRAINT fk_pg_country FOREIGN KEY (country_code) REFERENCES country(country_code)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS province (
    province_id     VARCHAR(20)  NOT NULL PRIMARY KEY,  -- ej. "IN.UP"
    province_name   VARCHAR(255) NOT NULL,
    country_code    VARCHAR(2)   NOT NULL,
    population      BIGINT       NULL,
    unreached_count INT          NULL,
    INDEX idx_prov_country (country_code),
    CONSTRAINT fk_prov_country FOREIGN KEY (country_code) REFERENCES country(country_code)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS ministry (
    id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ministry_name VARCHAR(255)  NOT NULL,
    ministry_type VARCHAR(255)  NULL,
    country_code  VARCHAR(2)    NULL,
    peop_code     VARCHAR(20)   NULL,  -- referencia flexible a people_group.peop_code
    contact_info  VARCHAR(1000) NULL,
    INDEX idx_min_country (country_code),
    INDEX idx_min_peop    (peop_code),
    CONSTRAINT fk_min_country FOREIGN KEY (country_code) REFERENCES country(country_code)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

-- =====================================================
-- JOSHUA PROJECT — datos agregados legacy (mapa/feed actual)
-- =====================================================
CREATE TABLE IF NOT EXISTS joshua_project_countries (
    id                       VARCHAR(191)  NOT NULL PRIMARY KEY,
    code                     VARCHAR(3)    NOT NULL UNIQUE,
    name                     VARCHAR(255)  NOT NULL,
    total_population         INT           NOT NULL DEFAULT 0,
    ethnic_groups_count      INT           NOT NULL DEFAULT 0,
    unreached_groups         INT           NOT NULL DEFAULT 0,
    primary_language         VARCHAR(255)  NOT NULL,
    primary_religion         VARCHAR(255)  NOT NULL,
    christian_percentage     DOUBLE        NOT NULL DEFAULT 0,
    evangelical_percentage   DOUBLE        NOT NULL DEFAULT 0,
    progress_bar_value       DOUBLE        NOT NULL DEFAULT 0,
    overview_text            TEXT          NULL,
    created_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_jpc_code (code),
    INDEX idx_jpc_name (name)
) ENGINE = InnoDB;

-- =====================================================
-- COURSES (Curso / Charla / Evento principal)
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id              VARCHAR(191) NOT NULL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    type            ENUM('COURSE','TALK','EVENT') NOT NULL,
    description     TEXT         NOT NULL,
    cover_image     VARCHAR(1000) NULL,
    created_by      VARCHAR(191) NOT NULL,
    -- Campos de eventos/charlas (opcionales; no aplican a cursos)
    modality        ENUM('VIRTUAL','IN_PERSON','HYBRID') NULL,  -- modalidad del evento
    location        VARCHAR(500) NULL,  -- dirección física (Presencial/Híbrido)
    event_date      DATETIME(3)  NULL,  -- fecha y hora del evento
    meeting_link    VARCHAR(1000) NULL,  -- Zoom / Meet / Teams
    recording_link  VARCHAR(1000) NULL,  -- grabación post-evento
    created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_courses_type       (type),
    INDEX idx_courses_created_by (created_by),
    CONSTRAINT fk_courses_user FOREIGN KEY (created_by) REFERENCES users(id)
      ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Migración para instalaciones existentes:
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS modality ENUM('VIRTUAL','IN_PERSON','HYBRID') NULL,
  ADD COLUMN IF NOT EXISTS location VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS event_date DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(1000) NULL,
  ADD COLUMN IF NOT EXISTS recording_link VARCHAR(1000) NULL;

-- =====================================================
-- COURSE LESSONS (Clases / grabaciones de un curso)
-- Relación padre-hijo: un curso tiene muchas clases.
-- =====================================================
CREATE TABLE IF NOT EXISTS course_lessons (
    id                VARCHAR(191)  NOT NULL PRIMARY KEY,
    course_id         VARCHAR(191)  NOT NULL,
    title             VARCHAR(255)  NOT NULL,
    description       TEXT          NULL,
    video_url         TEXT          NOT NULL,  -- YouTube embed / Drive preview / MP4 directo
    resources_url     TEXT          NULL,      -- (legado) recurso único; usar course_resources
    duration_seconds  INT           NULL,      -- duración opcional en segundos
    `order`           INT           NOT NULL,  -- posición en la lista de reproducción
    INDEX idx_lessons_course_order (course_id, `order`),
    CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- =====================================================
-- COURSE RESOURCES (recursos descargables con nombre)
-- Un recurso pertenece a una clase; se eliminan en cascada.
-- =====================================================
CREATE TABLE IF NOT EXISTS course_resources (
    id         VARCHAR(191) NOT NULL PRIMARY KEY,
    lesson_id  VARCHAR(191) NOT NULL,
    name       VARCHAR(255) NOT NULL,  -- nombre visible para el visitante
    url        TEXT         NOT NULL,  -- archivo del servidor (/api/uploads/...) o link externo
    INDEX idx_resources_lesson (lesson_id),
    CONSTRAINT fk_resources_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id                VARCHAR(191) NOT NULL PRIMARY KEY,
    user_id           VARCHAR(191) NOT NULL UNIQUE,
    email             VARCHAR(255) NOT NULL,
    phone             VARCHAR(50)  NULL,
    receive_whatsapp  BOOLEAN      NOT NULL DEFAULT FALSE,
    receive_email     BOOLEAN      NOT NULL DEFAULT TRUE,
    enrolled_courses  JSON         NOT NULL,  -- array de ids de cursos
    status            ENUM('ACTIVE','PENDING','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_subs_user_id (user_id),
    CONSTRAINT fk_subs_user FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- =====================================================
-- DONATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS donations (
    id                 VARCHAR(191) NOT NULL PRIMARY KEY,
    donor_name         VARCHAR(255) NOT NULL,
    donor_email        VARCHAR(255) NOT NULL,
    amount             DOUBLE       NOT NULL,
    currency           VARCHAR(3)   NOT NULL DEFAULT 'USD',
    target_country_id  VARCHAR(191) NULL,
    status             ENUM('PENDING','COMPLETED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_don_country (target_country_id),
    INDEX idx_don_status  (status),
    INDEX idx_don_created (created_at),
    INDEX idx_don_email   (donor_email),
    CONSTRAINT fk_don_country FOREIGN KEY (target_country_id) REFERENCES joshua_project_countries(id)
      ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;

-- =====================================================
-- DATOS SEMILLA — PAÍSES (Joshua Project)
-- =====================================================
INSERT INTO joshua_project_countries
  (id, code, name, total_population, ethnic_groups_count, unreached_groups, primary_language, primary_religion, christian_percentage, evangelical_percentage, progress_bar_value, overview_text)
VALUES
  ('c-peru', 'PER', 'Peru', 33720000, 98, 12, 'Spanish', 'Christianity', 94.5, 14.2, 78.5, 'Peru has a rich Christian heritage but still has unreached people groups in the Amazon basin and Andean highlands.'),
  ('c-mex',  'MEX', 'Mexico', 128500000, 287, 18, 'Spanish', 'Christianity', 95.2, 8.7, 82.3, 'Mexico is predominantly Christian with significant indigenous populations needing contextualized gospel outreach.'),
  ('c-col',  'COL', 'Colombia', 51870000, 102, 8, 'Spanish', 'Christianity', 92.3, 7.9, 75.8, 'Colombia has strong evangelical growth but faces challenges in remote regions affected by conflict.'),
  ('c-arg',  'ARG', 'Argentina', 45810000, 38, 4, 'Spanish', 'Christianity', 85.4, 10.5, 68.2, 'Argentina is highly urbanized with spiritual needs in secularized cities and indigenous communities.'),
  ('c-bra',  'BRA', 'Brazil', 215300000, 305, 42, 'Portuguese', 'Christianity', 88.9, 26.8, 71.4, 'Brazil has the largest evangelical population in Latin America but vast Amazon regions remain unreached.'),
  ('c-esp',  'ESP', 'Spain', 47420000, 22, 6, 'Spanish', 'Christianity', 77.3, 1.6, 45.1, 'Spain is historically Catholic but increasingly secular, with less than 2% evangelical presence.'),
  ('c-usa',  'USA', 'United States', 339700000, 498, 87, 'English', 'Christianity', 70.6, 25.4, 85.7, 'USA has diverse religious landscape with significant unreached immigrant communities.'),
  ('c-ind',  'IND', 'India', 1428000000, 2345, 2135, 'Hindi', 'Hinduism', 2.3, 0.8, 12.4, 'India has massive unreached populations with thousands of distinct people groups and languages.'),
  ('c-chn',  'CHN', 'China', 1425000000, 548, 432, 'Mandarin', 'Non-Religious', 7.4, 5.1, 38.9, 'China has rapid church growth but severe restrictions and hundreds of unreached groups.'),
  ('c-nga',  'NGA', 'Nigeria', 223800000, 527, 89, 'English', 'Islam', 48.2, 14.6, 58.3, 'Nigeria is nearly evenly split between Christianity and Islam with many unreached northern groups.')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- USUARIO ADMINISTRADOR INICIAL
-- -----------------------------------------------------
-- El hash de la contraseña se genera con bcrypt en tiempo
-- de ejecución para garantizar validez. Ejecuta:
--
--     npm run db:seed
--
-- Crea: admin@heartcry.org / admin123  (rol ADMIN)
-- =====================================================

-- =====================================================
-- VISTA ÚTIL — cursos con conteo de clases y duración total
-- =====================================================
CREATE OR REPLACE VIEW v_course_overview AS
SELECT
    c.id,
    c.title,
    c.type,
    COUNT(l.id) AS lessons_count,
    COALESCE(SUM(l.duration_seconds), 0) AS total_duration_seconds,
    u.name AS author_name
FROM courses c
LEFT JOIN course_lessons l ON l.course_id = c.id
LEFT JOIN users u ON u.id = c.created_by
GROUP BY c.id;