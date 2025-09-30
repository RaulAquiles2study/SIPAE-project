import database from './database.js';
import CONSTANTS from './CONSTANTS.js';
import get from './stuffGetter.js';
import getCSV from './getCSV.js'

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const app = express();

app.use(cors({
 allowedHeaders: ['Content-Type', 'token', 'filter'],
}));
app.use(express.json());

function authMiddleware(req, res, next) {
 const authHeader = req.headers['token'];
 if (!authHeader) return res.status(401).json({ok:false, error: 'Token ausente' });

 jwt.verify(authHeader, CONSTANTS.authSecret, async (err, decoded) => {
  if (err) return res.status(403).json({ok:false, error: 'Token inválido' });
  const u = decoded;
  const user = await database('users').where('UID',u.uid).first();
  if (user==null){
   return res.status(404).json({ok:false,error:'Usuário não encontrado'});
  }
  req.user = {uid:user.UID,rank:user.rank,nome:user.nome}
  next();
 });
}

function rankMiddleware(level){
 return async (req,res,next)=>{
  if (req.user.rank < level){
   return res.status(403).json({ok:false,error:'Acesso Negado'});
  }
  next();
 }
}

app.get('/users/all/:max',authMiddleware,rankMiddleware(4),async(req,res)=>{
 const max = Math.max(1,parseInt(req.params.max,10)||15);
 const users = await database('users').whereNot('UID',req.user.uid).limit(max);
 res.status(200).json(users);
});
app.post('/users/setRole',authMiddleware,async(req,res)=>{
 const {id,newrole} = req.body;
 const user = await database('users').where('UID',id).first();
 if (user==null){
  return res.status(404).json({ok:false,error:'Usuário não encontrado'});
 }
 //straight up bypass if UID 1 (database owner's account)
 const isPrimeUser = req.user.uid ==1;
 const targetIsLower = req.user.rank > user.rank;
 const hasPermission = req.user.rank > newrole;
 
 const canChangeRole = (targetIsLower&&hasPermission)||isPrimeUser;
 
 if (!canChangeRole){
  return res.status(401).json({ok:false,error:'Acesso Inválido'});
 }
 await database('users').update({rank:newrole}).where('UID',id);
 res.status(200).json({ok:true});
});
app.get('/users',authMiddleware, async (req,res)=>{
 res.status(200).json({ok:true,user:req.user});
});
app.post('/users',async(req,res)=>{
 const {name,email,pass} = req.body;
 if (!validateEmail(email)){
  return res.status(400).json({ok:false,error:'Email inválido!'})
 }

 const existingUser = await database('users').where('email',email).first();
 if (existingUser!=null){
  return res.status(409).json({ok:false,error:'Usuário com esse email já existe!'});
 }

 const salt = await bcrypt.genSalt(CONSTANTS.saltRounds);
 const hashedPass = await bcrypt.hash(pass,salt);

 const user = (await database('users').insert({email:email,senha:hashedPass,nome:name,rank:1}).returning('*'))[0];

 const token = jwt.sign(
  {uid:user.UID},
  CONSTANTS.authSecret,
 );

 res.status(201).json({ok:true,token:token});
});
app.delete('/users/:id',authMiddleware,rankMiddleware(4),async (req,res)=>{
 const {id} = req.params;
 const user = await database('users').where('UID',id).first();
 if (user==null){
  return res.status(404).json({ok:false,error:'Usuário não encontrado'});
 }
 await database('users').delete().where('UID',id);
 res.status(200).json({ok:true});
});

app.post('/login',async (req,res)=>{
 const {login,pass} = req.body;
 const user = await database('users').where('nome',login).orWhere('email',login).first();
 
 if (!user) {
  return res.status(401).json({ok:false, error: 'Usuário ou senha inválidos' });
 }
 const result = await bcrypt.compare(pass,user.senha);
 if (result){
  const token = jwt.sign(
   {uid:user.UID},
   CONSTANTS.authSecret,
  );

  res.status(200).json({ok:true,token:token});
 }else{
  res.status(401).json({ok:false,error:'Usuário ou senha inválidos'});
 }
});

/* MISC STUFF ZONE */
const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

/* ITEM REGISTER ZONE */
app.post('/setores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 await database('setores').insert({name:'Novo Setor'});
 res.status(201).json({ok:true});
});
app.post('/subsetores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id} = req.body;
 await database('subsetores').insert({name:'Novo Subsetor',sid:id})
 res.status(201).json({ok:true});
});
app.post('/tipoObjetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,isSub} = req.body
 await database('tipoObjetos').insert({name:'Novo tipo de objeto',sid:isSub?null:id,suid:isSub?id:null})
 res.status(201).json({ok:true});
});
app.post('/tipoObjetos/:tid/field',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {tid} = req.params;
 const cat = await database('tipoObjetos').where('ID',tid).first()
 await database.transaction(async trx=>{
  const queries = []
  queries.push(database('tipoObjetos').where('ID',tid)
 .update({customData:(cat.customData.length>0?cat.customData.split(','):[]).concat(['Novo Campo']).join(',')})
 .transacting(trx));
  queries.push(database('objetos').where('tid',tid)
 .update({customData:database.raw('CASE WHEN customdata = "" THEN "(Vazio)" ELSE customData || ",(Vazio)" END')})
 .transacting(trx))
  await Promise.all(queries)
 });
 return res.status(201).json({ok:true})
});
app.post('/objetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id} = req.body
 const cat = await database('tipoObjetos').where('ID',id).first()
 const data = (cat.customData.length>0?cat.customData.split(','):[])
 await database('objetos').insert({tid:id,customData:(data.map(()=>'(Vazio)')).join(',')})
 res.status(201).json({ok:true});
});

/* ITEM UPDATE ZONE */

app.put('/setores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,snm} = req.body
 if (snm.length>40){
  return res.status(400).json({ok:false,error:'Nome não pode ser maior que 40 caracteres'})
 }
 await database('setores').update({name:snm}).where('ID',id);
 res.status(200).json({ok:true});
});
app.put('/subsetores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,snm} = req.body
 if (snm.length>40){
  return res.status(400).json({ok:false,error:'Nome não pode ser maior que 40 caracteres'})
 }
 await database('subsetores').update({name:snm}).where('ID',id);
 res.status(200).json({ok:true});
});
app.put('/tipoObjetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,nm} = req.body
 if (nm.length>40){
  return res.status(400).json({ok:false,error:'Nome não pode ser maior que 40 caracteres'})
 }
 await database('tipoObjetos').update({name:nm}).where('ID',id);
 res.status(200).json({ok:true});
});
app.put('/tipoObjetos/field',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {tid,fid,fn} = req.body
 if (fn.includes(',')){
  return res.status(400).json({ok:false,error:'Campo não pode incluir vírgula!'})
 }
 const item = await database('tipoObjetos').where('ID',tid).first();
 const data = item.customData.split(',')
 if (data.includes(fn)){
  return res.status(400).json({ok:false,error:'Campos não podem ter o mesmo nome!'})
 }
 data[fid] = fn;
 await database('tipoObjetos').update({customData:data.join(',')}).where('ID',tid)
 return res.status(200).json({ok:true})
})
app.put('/objetos/state',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,np} = req.body
 await database('objetos').update({estado:parseFloat(np)}).where('ID',id);
 res.status(200).json({ok:true});
});
app.put('/objetos/field',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,fid,fv} = req.body
  if (fv.includes(',')){
  return res.status(400).json({ok:false,error:'Campo não pode incluir vírgula!'})
 }
 const item = await database('objetos').where('ID',id).first();
 const data = item.customData.split(',')
 data[fid] = fv;
 await database('objetos').update({customData:data.join(',')}).where('ID',id)
 return res.status(200).json({ok:true})
})

/* ITEM DELETE ZONE */

app.delete('/setores/:sid',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {sid} = req.params;
 await database('setores').delete().where('ID',sid)
 res.status(200).json({ok:true})
});
app.delete('/subsetores/:sid',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {sid} = req.params;
 await database('subsetores').delete().where('ID',sid)
 res.status(200).json({ok:true})
});
app.delete('/tipoObjetos/:tid',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {tid} = req.params;
 await database('tipoObjetos').delete().where('ID',tid)
 res.status(200).json({ok:true})
});
app.delete('/tipoObjetos/:tid/field/:id',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const tid = parseInt(req.params.tid)
 const id = parseInt(req.params.id)
 const cat = await database('tipoObjetos').where('ID',tid).first();
 //this is already a string, I'm just doing this for code completion to behave.
 const newdata = cat.customData.split(',')
 newdata.splice(id,1)
 const items = await database('objetos').where('tid',tid)
 await database.transaction(async trx=>{
  const queries = []
  queries.push(database('tipoObjetos').where('ID',tid)
  .update({customData:newdata.length>0?newdata.join(','):''}).transacting(trx))
  for (const item of items){
   const newdata = item.customData.split(',')
   newdata.splice(id,1)
   queries.push(database('objetos').where('ID',item.ID).transacting(trx)
  .update({customData:newdata.join(',')}))
  }
  return await Promise.all(queries)
 });
 return res.status(200).json({ok:true})
});
app.delete('/objetos/:id',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id} = req.params;
 await database('objetos').delete().where('ID',id)
 res.status(200).json({ok:true})
});

/* ITEM FETCH ZONE */

app.get('/getStuff',async(req,res)=>{
 const { filter } = req.headers;
 const {sec,sub,cat} = req.query;
 const result = await get.all(parseInt(filter),{sec:sec,sub:sub,cat:cat})
 console.log(result);
 res.status(200).json(result);
});
app.get('/sector/childType/:id',async(req,res)=>{
 const {id} = req.params;
 const sectorChildren = await database('subSetores').where('sid',id)
 if (sectorChildren.length > 0) return res.status(200).json({ok:true,result:1})
 const cat = await database('tipoObjetos').where('sid',id)
 if (cat.length > 0) return res.status(200).json({ok:true,result:-1})
  return res.status(200).json({ok:true,result:0})
});
app.get('/category/:tid',async(req,res)=>{
 const {tid}=req.params;
 const cat = await database('tipoObjetos').where('ID',tid).first()
 const extraData = await get.categoryInfo(tid)
 const objs = await get.objects(tid)
 return res.status(200).json({...cat,children:objs,...extraData})
});
app.get('/csv',async(req,res)=>{
 const csvstr = await getCSV();
 return res.status(200).json({result:csvstr});
});

const PORT = 3000;
app.listen(PORT,'0.0.0.0',()=>{
 console.log(`listening on ${PORT}`);
});
