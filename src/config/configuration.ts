export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
  },
  port: parseInt(process.env.PORT || '3000', 10),
});
