import database from '../database.js';

import { authMiddleware,rankMiddleware } from "../server.js";
import { Router } from 'express';
const router = Router();

router.delete('/subsetores/:sid',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {sid} = req.params;
 const subsect = await database('subsetores').where('ID',sid).first();
 await database('subsetores').delete().where('ID',sid)

 await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Deletou subsetor '+subsect.name,data:Date.now()})
 res.status(200).json({ok:true})
});

router.put('/subsetores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,snm} = req.body
 if (snm.length>40){
  return res.status(400).json({ok:false,error:'Nome não pode ser maior que 40 caracteres'})
 }
  if (snm.trim().length<1){
  return res.status(400).json({ok:false,error:'Nome não pode ser vazio'})
 }
 const subsect = await database('subsetores').where('ID',id).first();
 await database('subsetores').update({name:snm}).where('ID',id);
 await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Renomeou subsetor '+subsect.name+' para '+snm,data:Date.now()})
 res.status(200).json({ok:true});
});

router.post('/subsetores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id} = req.body;
 await database('subsetores').insert({name:'Novo Subsetor',sid:id})
 await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Criou subsetor',data:Date.now()})
 res.status(201).json({ok:true});
});

export default router