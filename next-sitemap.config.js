/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://chidchanun.online',
  generateRobotsTxt: true, // สร้าง robots.txt ด้วย
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  outDir: './public',
  additionalPaths: async (config) => [
    '/login',
    '/student-home',
    '/teacher',
    '/dashboard',
  ],
};
