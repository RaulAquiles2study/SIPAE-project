import database from '../database.js';
import CONSTANTS from '../CONSTANTS.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { authMiddleware,rankMiddleware } from "../server.js";
import { Router } from 'express';
const router = Router();

router.get('/users/all',authMiddleware,rankMiddleware(4),async(req,res)=>{
  const users = await database('users').whereNot('UID',req.user.uid);
  res.status(200).json({ok:true,result:users});
});


router.post('/users/setRole',authMiddleware,async(req,res)=>{
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


router.get('/users',authMiddleware, async (req,res)=>{
  res.status(200).json({ok:true,result:req.user});
});


router.post('/users',async(req,res)=>{
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

  res.status(201).json({ok:true,result:token});
});


router.delete('/users/:id',authMiddleware,rankMiddleware(4),async (req,res)=>{
  const {id} = req.params;
  const user = await database('users').where('UID',id).first();
  if (user==null){
    return res.status(404).json({ok:false,error:'Usuário não encontrado'});
  }
  await database('users').delete().where('UID',id);
  res.status(200).json({ok:true});
});


router.post('/login',async (req,res)=>{
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

    res.status(200).json({ok:true,result:token});
  }else{
    res.status(401).json({ok:false,error:'Usuário ou senha inválidos'});
  }
});


const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};
export default router