"use server"

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export async function syncUser(){
    try{
        const {userId} = await auth();
        const user = await currentUser();
        if(!userId || !user) return;
        //check if user exists
        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId
            },
        })
        if(existingUser) return existingUser
        const dbUser = await prisma.user.create({
            data:{
                clerkId: userId,
                name: `${user.firstName || ''} ${user.lastName || ''}`,
                username: user.username ?? user.emailAddresses[0].emailAddress.split('@')[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl,
            }
        })
        return dbUser

    }catch(err){
        console.log(`Error in syncUser: ${err}`)
    }
}

export async function getUserByClerkId(clerkId: string){
    return prisma.user.findUnique({
        where:{
            clerkId,
        },
        include:{
            _count:{
                select:{
                    followers:true,
                    following:true,
                    posts:true, 
                }
            }
        }

    })
}

export async function getDbUserId(){
    const {userId: clerkId} = await auth();
    if(!clerkId){
        return null
    }
    const user = await getUserByClerkId(clerkId);
    if(!user) throw new Error('User not found');
    return user.id
}

export async function getRandomUser(){
    try{
        const userId=  await getDbUserId();
        if(!userId) return []
        const randomUsers = await prisma.user.findMany({
            where:{
                AND:[
                    {NOT:{id:userId}},
                    {
                        NOT:{
                            followers:{
                                some:{
                                    followerId: userId
                                }
                            }
                        }
                    }
                ]
            },
            select:{
                id:true,
                name:true,
                username:true,
                image:true,
                _count:{
                    select:{
                        followers:true
                    }
                }
            },
            take: 3
        })
        return randomUsers
    }catch(err){
        console.log('Error in generating random users',err)
        return [ ]
    }

}
export async function toggleFollow(targetUserId:string){
    try{
        const userId = await getDbUserId();
        if(userId==targetUserId) throw new Error("You cannot follow yourself");
        if(!userId) return;
        const existingFollow = await prisma.follows.findUnique({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId
                }
            }
        })
        if(existingFollow){
            //unfollow
            await prisma.follows.delete({
                where:{
                    followerId_followingId:{
                        followerId:userId,
                        followingId:targetUserId
                    }
                }
            })
        }else{
            //follow
            await prisma.$transaction([
                prisma.follows.create({
                    data:{
                        followerId:userId,
                        followingId:targetUserId
                    }
                })
                ,
                prisma.notification.create({
                    data:{
                        type:'FOLLOW',
                        userId:targetUserId,
                        creatorId:userId
                    }
                })
            ])
        }
        revalidatePath('/')
        return {success:true}
    }catch(err){
        console.log('Error in followingtoggle action',err)
        return {success:false}
    }

}