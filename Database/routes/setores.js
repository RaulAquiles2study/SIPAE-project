import database from '../database.js';

import { authMiddleware,rankMiddleware } from "../server.js";
import { Router } from 'express';
const router = Router();

router.post('/setores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 await database('setores').insert({name:'Novo Setor'});
 await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Criou setor',data:Date.now()})
 res.status(201).json({ok:true});
});

router.put('/setores',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {id,snm} = req.body
 if (snm.length>40){
  return res.status(400).json({ok:false,error:'Nome não pode ser maior que 40 caracteres'})
 }
 if (snm.trim().length<1){
  return res.status(400).json({ok:false,error:'Nome não pode ser vazio'})
 }
 const sect = await database('setores').where('ID',id).first();
 await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Renomeou setor '+sect.name+' para '+snm,data:Date.now()})
 await database('setores').update({name:snm}).where('ID',id);
 res.status(200).json({ok:true});
});

router.delete('/setores/:sid',authMiddleware,rankMiddleware(5),async(req,res)=>{
 const {sid} = req.params;
 const sect = await database('setores').where('ID',sid).first();
 await database('useRegister').insert({user:req.user.nome,useremail:req.user.email,acao:'Deletou setor '+sect.name,data:Date.now()})
 await database('setores').delete().where('ID',sid)
 res.status(200).json({ok:true}) 
});

router.get('/sector/childType/:id',async(req,res)=>{
 const {id} = req.params;
 const sectorChildren = await database('subSetores').where('sid',id)
 if (sectorChildren.length > 0) return res.status(200).json({ok:true,result:1})
 const cat = await database('tipoObjetos').where('sid',id)
 if (cat.length > 0) return res.status(200).json({ok:true,result:-1})
  return res.status(200).json({ok:true,result:0})
});
export default router