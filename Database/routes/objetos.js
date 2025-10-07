import database from '../database.js';

import { authMiddleware,rankMiddleware } from "../server.js";
import { Router } from 'express';
const router = Router();

 router.post('/objetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {id} = req.body
  const cat = await database('tipoObjetos').where('ID',id).first()
  const data = (cat.customData.length>0?cat.customData.split(','):[])
  await database('objetos').insert({tid:id,customData:(data.map(()=>'(Vazio)')).join(',')})
  res.status(201).json({ok:true});
 });

 router.get('/objetos',async(req,res)=>{
    let count = 0;
    let values = 0;
    for (const obj of await database('objetos')){
        count++;
        values+=obj.valor
    }
    return res.status(200).json({ok:true,result:{count:count,sum:values}}); 
 });


 router.put('/objetos/state',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {id,np} = req.body
  await database('objetos').update({estado:parseInt(np)}).where('ID',id);
  res.status(200).json({ok:true});
 });


 router.put('/objetos/cost',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {id,valor} = req.body
  await database('objetos').update({valor:valor}).where('ID',id);
  res.status(200).json({ok:true});
 });


 router.put('/objetos/field',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const {id,fid,fv} = req.body
   if (fv.includes(',')){
   return res.status(400).json({ok:false,error:'Campo não pode incluir vírgula!'})
  }
   if (fv.trim().length<1){
   return res.status(400).json({ok:false,error:'Campo não pode ser vazio!'})
  }
  const item = await database('objetos').where('ID',id).first();
  const data = item.customData.split(',')
  data[fid] = fv;
  await database('objetos').update({customData:data.join(',')}).where('ID',id)
  return res.status(200).json({ok:true})
 })


 router.delete('/objetos',authMiddleware,rankMiddleware(5),async(req,res)=>{
  const selection = req.query.selection.split(',');
  await database('objetos').delete().whereIn('ID',selection)
  res.status(200).json({ok:true})
 });
export default router
