"use client"
import * as React from 'react';
import {MoonIcon, SunIcon} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

export default function ModeToggle(){
    const {theme, setTheme} = useTheme();
    return(
        <Button
        size='icon'
        onClick={()=> setTheme(theme === 'dark' ? 'light':'dark'
        )} 
        variant="outline">
            <SunIcon className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0 duration-1000 ' ></SunIcon>
            <MoonIcon className=' absolute h-[1.2rem]  w-[1.2rem] rotate-90 scale-0 transition-all duration-1000  dark:rotate-0 dark:scale-100 '></MoonIcon>
            <span className="sr-only">Toggle Theme</span>
        </Button>
    )
}