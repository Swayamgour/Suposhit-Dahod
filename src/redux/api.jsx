import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// const BASE_URL = "https://daryoo.lead.crm.amaxjobs.com/api";
// const BASE_URL = "https://jjc-backend-2.onrender.com/api";
const BASE_URL = "http://localhost:5002/api";
// const BASE_URL = "https://jjc.admin.amaxjobs.com/api";

const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {

        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (token) {
            headers.set("authorization", `Bearer ${token}`);
        }

        headers.set("Content-Type", "application/json");

        return headers;
    },
});

export const api = createApi({
    reducerPath: "api",
    baseQuery,
    tagTypes: [
        "Auth",

    ],

    endpoints: (builder) => ({



        getCategory: builder.query({
            query: () => "/categories",
            providesTags: ["Auth"],
        }),


        registerUser: builder.mutation({
            query: (data) => ({
                url: "/auth/register",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Auth"],
        }),
        loginUser: builder.mutation({
            query: (data) => ({
                url: "/auth/login",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Auth"],
        }),





    }),
});

export const {

    useGetCategoryQuery,
    useRegisterUserMutation,
    useLoginUserMutation  ,

} = api;