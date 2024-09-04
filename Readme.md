Fastify Web Server with PostgreSQL and Redis
This is a simple Fastify-based web server designed as a test assignment. It interacts with the Skinport API and provides two main endpoints for item retrieval and user balance management. The project uses PostgreSQL for storing user data and Redis for caching API responses.

Prerequisites
Before running the project, ensure you have the following installed on your machine:

Node.js (v18+ recommended)
PostgreSQL
Redis

## Kurulum

### 1. Reposu Kopyalayın

Clone this project:

```bash
git clone https://github.com/hamzaatmaca/fastify-case.git
cd fastify-case

```npm
npm install

```PG
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0
);

-- Add user
INSERT INTO users (balance) VALUES (500.00);

```npm
npm run dev

