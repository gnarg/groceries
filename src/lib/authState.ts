import { writable } from "svelte/store";

const storage = localStorage.getItem("authState");
export const authState = writable(storage);
authState.subscribe(value => {
  if (value) {
    localStorage.setItem("authState", value);
  }
});
