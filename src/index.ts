import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`\n🚀  Finance Dashboard API running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Docs:    http://localhost:${PORT}/api/docs`);
  console.log(`   Health:  http://localhost:${PORT}/health\n`);
});
