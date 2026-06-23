-- Migration: Add renewal_status column to documents table
-- Run with: psql $DATABASE_URL -f server/migrations/001_add_renewal_status.sql

ALTER TABLE documents
ADD COLUMN renewal_status VARCHAR(20) DEFAULT 'pending';
