// crates/golden-service/src/redis_quota.rs
use redis::{AsyncCommands, Client};
use std::time::{SystemTime, UNIX_EPOCH};
use anyhow::{Result, anyhow};

pub struct RedisQuota {
    client: Client,
    limit_per_min: u32,
}
impl RedisQuota {
    pub fn new(url: &str, limit_per_min: u32) -> Result<Self> {
        let client = Client::open(url)?;
        Ok(Self { client, limit_per_min })
    }
    pub async fn check(&self, tenant: &str, cost: u32) -> Result<bool> {
        let mut con = self.client.get_async_connection().await?;
        let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
        let bucket = now / 60;
        let key = format!("quota:{}:{}", tenant, bucket);
        let used: i64 = con.incr(&key, cost as i64).await?;
        if used == cost as i64 {
            // first time seen: set TTL
            let _: () = con.expire(&key, 120).await?; // 2 minutes to cover clock skew
        }
        Ok(used as u32 <= self.limit_per_min)
    }
}
