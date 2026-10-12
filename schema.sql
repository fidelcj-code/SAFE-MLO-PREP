-- FUTURE BACKEND SPECIFICATION — NOT CONNECTED TO THE CURRENT STATIC APP.
-- PostgreSQL schema for multi-device storage. Review security, RLS and migrations before deploying.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE content_area AS ENUM ('FED','USC','GMK','ORIG','ETH');
CREATE TYPE question_status AS ENUM ('draft','needs_review','verified','retired');
CREATE TYPE question_mode AS ENUM ('fresh','review','adaptive');
CREATE TYPE session_kind AS ENUM ('practice','exam');

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 auth_provider_id text UNIQUE NOT NULL,
 preferred_question_mode question_mode NOT NULL DEFAULT 'adaptive',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE equivalence_families (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 normalized_hash text UNIQUE,
 reviewer_notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 version integer NOT NULL CHECK(version>0),
 family_id uuid NOT NULL REFERENCES equivalence_families(id),
 category content_area NOT NULL,
 topic text NOT NULL,
 level smallint NOT NULL CHECK(level BETWEEN 1 AND 3),
 is_math boolean NOT NULL DEFAULT false,
 prompt text NOT NULL,
 answer_explanation jsonb NOT NULL,
 source_url text NOT NULL,
 status question_status NOT NULL DEFAULT 'draft',
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(family_id,version)
);
CREATE TABLE question_choices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
 position smallint NOT NULL CHECK(position BETWEEN 0 AND 3),
 body text NOT NULL,
 correct boolean NOT NULL DEFAULT false,
 UNIQUE(question_id,position)
);
-- Application validation must enforce four choices / exactly one correct answer per question.
CREATE TABLE user_question_exposure (
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 family_id uuid NOT NULL REFERENCES equivalence_families(id),
 first_question_id uuid NOT NULL REFERENCES questions(id),
 first_seen_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 first_answered_at timestamptz,
 first_attempt_correct boolean,
 exposure_count integer NOT NULL DEFAULT 1 CHECK(exposure_count>=1),
 PRIMARY KEY (user_id,family_id)
);
CREATE TABLE study_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind session_kind NOT NULL,
 mode question_mode NOT NULL,
 settings jsonb NOT NULL,
 requested_count integer NOT NULL CHECK(requested_count BETWEEN 1 AND 120),
 started_at timestamptz NOT NULL DEFAULT now(),
 ends_at timestamptz,
 submitted_at timestamptz
);
CREATE TABLE session_questions (
 session_id uuid NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
 question_id uuid NOT NULL REFERENCES questions(id),
 family_id uuid NOT NULL REFERENCES equivalence_families(id),
 position integer NOT NULL CHECK(position>=0),
 fresh_at_start boolean NOT NULL,
 PRIMARY KEY(session_id,question_id),
 UNIQUE(session_id, family_id),
 UNIQUE(session_id, position)
);
CREATE TABLE question_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 session_id uuid NOT NULL REFERENCES study_sessions(id),
 question_id uuid NOT NULL REFERENCES questions(id),
 family_id uuid NOT NULL REFERENCES equivalence_families(id),
 selected_choice_id uuid NOT NULL REFERENCES question_choices(id),
 correct boolean NOT NULL,
 first_attempt boolean NOT NULL,
 fresh_at_start boolean NOT NULL,
 answered_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX unique_first_attempt_per_family ON question_attempts(user_id,family_id) WHERE first_attempt=true;
CREATE INDEX attempts_user_time ON question_attempts(user_id,answered_at DESC);
CREATE INDEX questions_category_status ON questions(category,status);
CREATE INDEX session_user_date ON study_sessions(user_id,started_at DESC);
CREATE TABLE notebook_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 source_question_id uuid REFERENCES questions(id),
 title text NOT NULL,
 content text NOT NULL,
 is_math boolean NOT NULL DEFAULT false,
 steps jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- SECURITY TODO: enable and configure PostgreSQL row-level security for every user-owned table.
-- TRANSACTION TODO: lock families/exposures when reserving fresh questions to prevent concurrent reuse.
