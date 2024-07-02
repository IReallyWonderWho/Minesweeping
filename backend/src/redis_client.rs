use redis::{AsyncCommands, Client, Commands, FromRedisValue, RedisResult, ToRedisArgs};

pub struct RedisClient {
    client: Client,
}

impl RedisClient {
    pub fn new() -> Self {
        let client = Client::open("redis://127.0.0.1/").unwrap();

        Self { client }
    }

    pub async fn get<T: FromRedisValue>(&self, key: &str) -> RedisResult<T> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;
        let value: T = connection.get(key).await?;

        Ok(value)
    }

    pub async fn set<T: ToRedisArgs + Send + Sync>(&self, key: &str, value: T) -> RedisResult<()> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;
        let _: () = connection.set(key, value).await?;

        Ok(())
    }

    pub async fn exists(&self, key: &str) -> RedisResult<bool> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;

        Ok(connection.exists(key).await?)
    }

    pub async fn hexists(&self, key: &str, field: &str) -> RedisResult<bool> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;

        Ok(connection.hexists(key, field).await?)
    }

    pub fn sync_hexists(&self, key: &str, field: &str) -> RedisResult<bool> {
        let mut connection = self.client.get_connection()?;

        Ok(connection.hexists(key, field)?)
    }

    pub async fn hset<T: ToRedisArgs + Send + Sync>(
        &self,
        key: &str,
        field: &str,
        value: T,
    ) -> RedisResult<()> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;
        connection.hset(key, field, value).await?;

        Ok(())
    }

    pub async fn hget<T: FromRedisValue>(&self, key: &str, field: &str) -> RedisResult<T> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;
        let value: T = connection.hget(key, field).await?;

        Ok(value)
    }

    pub async fn hgetall<T: FromRedisValue>(&self, key: &str) -> RedisResult<T> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;

        let value: T = connection.hgetall(key).await?;

        Ok(value)
    }

    pub async fn del(&self, key: &str) -> RedisResult<()> {
        let mut connection = self.client.get_multiplexed_async_connection().await?;

        connection.del(key).await?;

        Ok(())
    }
}

impl Clone for RedisClient {
    fn clone(&self) -> Self {
        Self {
            client: self.client.clone(),
        }
    }
}
