import axios from "axios";

export const api = axios.create({
  baseURL: "https://localhost:44322/api/PDF", 
});