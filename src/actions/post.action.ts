"use server"

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action"
import { revalidatePath } from "next/cache";

export async function createPost(content:string , image:string){
    try{
        const userId = await getDbUserId();
        const post = await prisma.post.create({
            data:{
                content,
                image,
                authorId : userId
            }
        })
        revalidatePath('/')
        return {success:true,post}
    }catch(err){
        console.log('Failed to create the post', err)
        return {success:false, error:"Failed to create post"}
    }
}