import Fastify from "fastify";
import { Pool } from "pg";
import axios from "axios";
import Redis from "ioredis";

const fastify = Fastify({ logger: true });
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
});

fastify.get("/items", async (request, reply) => {
  const cachedData = await redis.get("items");
  if (cachedData) {
    return reply.send(JSON.parse(cachedData));
  }

  try {
    const { data } = await axios.get("https://api.skinport.com/v1/items", {
      params: {
        app_id: "default",
        currency: "default",
      },
      headers: {
        Authorization: `Bearer ${process.env.SKINPORT_API_KEY}`,
      },
    });

    const items = data.map((item) => ({
      id: item.id,
      name: item.name,
      tradable_min_price: item.min_price_tradable,
      non_tradable_min_price: item.min_price_non_tradable,
    }));

    await redis.set("items", JSON.stringify(items), "EX", 3600);

    return reply.send(items);
  } catch (error) {
    return reply.status(500).send({ error: "Failed to fetch items" });
  }
});

fastify.post("/users/:id/decrease-balance", async (request, reply) => {
  const userId = request.params.id;
  const { amount } = request.body;

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        "SELECT balance FROM users WHERE id = $1",
        [userId]
      );
      if (rows.length === 0) {
        throw new Error("User not found");
      }

      const userBalance = rows[0].balance;
      if (userBalance < amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = userBalance - amount;
      await client.query("UPDATE users SET balance = $1 WHERE id = $2", [
        newBalance,
        userId,
      ]);
      await client.query("COMMIT");

      return reply.send({ success: true, newBalance });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    fastify.log.info(`Server listening on ${fastify.server.address()}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
