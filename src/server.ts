import express from 'express' 
import cors from 'cors'
import { corsConfig } from './config/cors'
import colors from 'colors'
import morgan from 'morgan'
import { db } from './config/db'
import asignacionRouter from './routes/asignacionRouter'
import authRouter from './routes/authRouter'
import dashboardRouter from './routes/dashboardRouter';
import storageRouter from './routes/storageRouter';
import { seedPreguntas } from './seeders/preguntas.seed'

async function connectDB() {
    try {
        await db.authenticate()
        await db.sync()
        await seedPreguntas();
        console.log(colors.blue.bold('Conexión exitosa a BD'))
    } catch (error) {
        console.log(error)
        console.log(colors.red.bold('Falló la Conexión a la BD'))
    }
}

connectDB()

const app = express()

app.set('trust proxy', 1)

app.use(cors(corsConfig))

app.use(morgan('dev'))

app.use(express.json())

app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/storage', storageRouter);
app.use('/api/v1/assignments', asignacionRouter);
app.use('/api/v1/auth', authRouter);

export default app