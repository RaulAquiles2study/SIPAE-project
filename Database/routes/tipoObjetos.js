import database from '../database.js';
import get from '../stuffGetter.js';

import { authMiddleware,rankMiddleware } from "../server.js";
import { Router } from 'express';
const router = Router();

 router.post('/tipoObjetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {id,isSub} = req.body
  await database('tipoObjetos').insert({name:'Novo tipo de objeto',sid:isSub?null:id,suid:isSub?id:null})
  await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Criou tipo de objeto',data:Date.now()});
  res.status(201).json({ok:true});
 });


 router.post('/tipoObjetos/:tid/field',authMiddleware,rankMiddleware(5),async(req,res)=>{
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


 router.put('/tipoObjetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {id,nm} = req.body
  if (nm.length>40){
   return res.status(400).json({ok:false,error:'Nome não pode ser maior que 40 caracteres'})
  }
   if (nm.trim().length<1){
   return res.status(400).json({ok:false,error:'Nome não pode ser vazio'})
  }
  const typ = await database('tipoObjetos').where('ID',id).first();
  await database('tipoObjetos').update({name:nm}).where('ID',id);
  await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Renomeou tipo de objeto '+typ.name+' para '+nm,data:Date.now()});
  res.status(200).json({ok:true});
 });


 router.put('/tipoObjetos/field',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {tid,fid,fn} = req.body
  if (fn.includes(',')){
   return res.status(400).json({ok:false,error:'Campo não pode incluir vírgula!'})
  }
  if (fn.trim().length<1){
   return res.status(400).json({ok:false,error:'Campo não pode ser vazio!'})
  }
  const item = await database('tipoObjetos').where('ID',tid).first();
  const data = item.customData.split(',')
  if (data.includes(fn)){
   return res.status(400).json({ok:false,error:'Campos não podem ter o mesmo nome!'})
  }
  data[fid] = fn;
  await database('tipoObjetos').update({customData:data.join(',')}).where('ID',tid)
  await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Renomeou campo '+fid+' para '+fn,data:Date.now()});
  return res.status(200).json({ok:true});
 });


 router.delete('/tipoObjetos/:tid',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {tid} = req.params;
  const typ = await database('tipoObjetos').where('ID',tid).first();
  await database('tipoObjetos').delete().where('ID',tid)
  await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Deletou tipo de objeto '+typ.name,data:Date.now()});
  res.status(200).json({ok:true})
 });


 router.delete('/tipoObjetos/:tid/field/:id',authMiddleware,rankMiddleware(5),async(req,res)=>{
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

 router.get('/tipoObjetos/:tid',async(req,res)=>{
  const {tid}=req.params;
  const cat = await database('tipoObjetos').where('ID',tid).first()
  const extraData = await get.categoryInfo(tid)
  const objs = await get.objects(tid)
  return res.status(200).json({ok:true,result:{...cat,children:objs,...extraData}})
 });
export default router