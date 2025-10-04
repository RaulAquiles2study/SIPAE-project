import database from './database.js';
import CONSTANTS from './CONSTANTS.js';
import get from './getters/stuffGetter.js';
import getCSV from './getters/getCSV.js'

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'

import usersRoutes from './routes/users.js';
import setoresRoutes from './routes/setores.js';
import subsetoresRoutes from './routes/subsetores.js';
import tipoObjetosRoutes from './routes/tipoObjetos.js';
import objetosRoutes from './routes/objetos.js';
import manutencaoRoutes from './routes/manutencoes.js';

const app = express();

app.use(cors({
 allowedHeaders: ['Content-Type', 'token', 'filter','selection'],
}));
app.use(express.json());

export function authMiddleware(req, res, next) {
 const authHeader = req.headers['token'];
 if (!authHeader) return res.status(401).json({ok:false, error: 'Token ausente' });

 jwt.verify(authHeader, CONSTANTS.authSecret, async (err, decoded) => {
  if (err) return res.status(403).json({ok:false, error: 'Token inválido' });
  const u = decoded;
  const user = await database('users').where('UID',u.uid).first();
  if (user==null){
   return res.status(404).json({ok:false,error:'Usuário não encontrado'});
  }
  req.user = {uid:user.UID,rank:user.rank,nome:user.nome,email:user.email}
  next();
 });
}

export function rankMiddleware(level){
 return async (req,res,next)=>{
  if (req.user.rank < level){
   return res.status(403).json({ok:false,error:'Acesso Negado'});
  }
  next();
 }
}

app.use(usersRoutes)
app.use(setoresRoutes)
app.use(subsetoresRoutes)
app.use(tipoObjetosRoutes)
app.use(objetosRoutes)
app.use(manutencaoRoutes)

app.get('/getStuff',async(req,res)=>{
 const { filter } = req.headers;
 const {sec,sub,cat} = req.query;
 const result = await get.all(parseInt(filter),{sec:sec,sub:sub,cat:cat})
 res.status(200).json({ok:true,result:result});
});

app.get('/csv',async(req,res)=>{
 const csvstr = await getCSV();
 return res.status(200).json({ok:true,result:csvstr});
});

app.get('/registry',authMiddleware,rankMiddleware(4),async(req,res)=>{
 const result = await database('useRegister').orderBy('ID','desc');
 return res.status(200).json({ok:true,result:result})
});


const PORT = 3000;
app.listen(PORT,'0.0.0.0',()=>{
 console.log(`listening on ${PORT}`);
});
