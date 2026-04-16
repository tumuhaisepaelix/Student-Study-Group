-- Migration to add faculty to profiles table
ALTER TABLE public.profiles ADD COLUMN faculty TEXT NOT NULL DEFAULT '';
