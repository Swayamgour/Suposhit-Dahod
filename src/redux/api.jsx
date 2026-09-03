import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Matches icds-backend server.js -> app.use("/api/...") mounts + PORT (default 5000)
const BASE_URL = 'https://icds-backend-goeh.onrender.com/api';
// const BASE_URL = 'http://localhost:5000/api';


function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

// Signals AuthContext (see its "auth:session-expired" listener) to log the
// user out and drop them back on the login screen - used wherever a request
// comes back 401 (RTK Query base query below, and the plain-fetch upload /
// report-download helpers in utils/apiClient.js). No full page reload, so
// in-progress state elsewhere in the app isn't lost unnecessarily.
export function handleSessionExpired() {
    window.dispatchEvent(new Event("auth:session-expired"));
}

const rawBaseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
        const token = getToken();
        if (token) headers.set("authorization", `Bearer ${token}`);
        headers.set("Content-Type", "application/json");
        return headers;
    },
});

// Any expired/invalid-token response (401 from the auth middleware, e.g.
// "Not authorized, token invalid" / "Not authorized, no token" / "Not
// authorized, token expired") clears the session and kicks back to login,
// instead of every page having to check for it individually.
const baseQuery = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error?.status === 401) {
        handleSessionExpired();
    }
    return result;
};

export const api = createApi({
    reducerPath: "api",
    baseQuery,
    tagTypes: [
        "Auth", "Records", "MukhyaSevika", "Dashboard", "Users", "Hierarchy",
        "Tasks", "TaskSubmissions", "Grades", "Notices",
    ],

    endpoints: (builder) => ({
        // ---------------- AUTH (routes/authRoutes.js) ----------------
        registerUser: builder.mutation({
            query: (data) => ({ url: "/auth/register", method: "POST", body: data }),
            invalidatesTags: ["Auth"],
        }),
        loginUser: builder.mutation({
            query: (data) => ({ url: "/auth/login", method: "POST", body: data }),
            invalidatesTags: ["Auth"],
        }),
        getMe: builder.query({
            query: () => "/auth/me",
            providesTags: ["Auth"],
        }),

        // ---------------- HIERARCHY (routes/hierarchyRoutes.js) ----------------
        getDistricts: builder.query({
            query: () => "/hierarchy/district",
            providesTags: ["Hierarchy"],
        }),
        createDistrict: builder.mutation({
            query: (data) => ({ url: "/hierarchy/district", method: "POST", body: data }),
            invalidatesTags: ["Hierarchy"],
        }),
        getBlocks: builder.query({
            query: () => "/hierarchy/block",
            providesTags: ["Hierarchy"],
        }),
        createBlock: builder.mutation({
            query: (data) => ({ url: "/hierarchy/block", method: "POST", body: data }),
            invalidatesTags: ["Hierarchy"],
        }),
        getSectors: builder.query({
            query: () => "/hierarchy/sector",
            providesTags: ["Hierarchy"],
        }),
        createSector: builder.mutation({
            query: (data) => ({ url: "/hierarchy/sector", method: "POST", body: data }),
            invalidatesTags: ["Hierarchy"],
        }),
        getAwcs: builder.query({
            query: () => "/hierarchy/awc",
            providesTags: ["Hierarchy"],
        }),
        createAwc: builder.mutation({
            query: (data) => ({ url: "/hierarchy/awc", method: "POST", body: data }),
            invalidatesTags: ["Hierarchy"],
        }),

        // ---------------- UPLOAD (routes/uploadRoutes.js) ----------------
        // multipart/form-data - bypasses the JSON baseQuery entirely so the
        // browser can set its own multipart boundary header.
        uploadPhotos: builder.mutation({
            async queryFn(files) {
                try {
                    const formData = new FormData();
                    files.forEach((file) => formData.append("photos", file));

                    const res = await fetch(`${BASE_URL}/upload`, {
                        method: "POST",
                        headers: { authorization: `Bearer ${getToken()}` },
                        body: formData,
                    });
                    const data = await res.json();
                    if (!res.ok) return { error: { status: res.status, data } };
                    return { data };
                } catch (err) {
                    return { error: { status: "FETCH_ERROR", error: String(err) } };
                }
            },
        }),

        // ---------------- RECORDS (routes/recordRoutes.js) - AWC worker daily entry ----------------
        getRecords: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.fromDate) qs.set("fromDate", params.fromDate);
                if (params.toDate) qs.set("toDate", params.toDate);
                if (params.status) qs.set("status", params.status);
                const s = qs.toString();
                return `/records${s ? `?${s}` : ""}`;
            },
            providesTags: ["Records"],
        }),


        getRecordsChild: builder.query({
            query: () => "/records/awc-children",
            providesTags: ["Records"],
        }),
        createRecord: builder.mutation({
            query: (data) => ({ url: "/records", method: "POST", body: data }),
            invalidatesTags: ["Records", "Dashboard"],
        }),
        // Full update of an existing record - same payload shape as
        // createRecord (see WorkerEntry.jsx's handleSubmit), just a PUT to
        // /records/:id instead of a POST to /records. Used by the pencil
        // (edit) icon on WorkerList.
        updateRecord: builder.mutation({
            query: ({ id, ...data }) => ({ url: `/records/${id}`, method: "PUT", body: data }),
            invalidatesTags: ["Records", "Dashboard"],
        }),
        // Add/replace one or more of the 6 photo slots on an existing (still
        // "pending") record - send { <fieldName>: { url, latitude, longitude,
        // capturedAt } } for just the slot(s) you're updating right now, e.g.
        // { afternoonDishPhoto: { url, latitude, longitude, capturedAt } }.
        updateRecordPhotos: builder.mutation({
            query: ({ id, ...photoFields }) => ({
                url: `/records/${id}/photos`,
                method: "PATCH",
                body: photoFields,
            }),
            invalidatesTags: ["Records", "Dashboard"],
        }),
        reviewRecord: builder.mutation({
            query: ({ id, status, remarks }) => ({
                url: `/records/${id}/review`,
                method: "PATCH",
                body: { status, remarks },
            }),
            invalidatesTags: ["Records", "Dashboard"],
        }),

        // ---------------- MUKHYA SEVIKA (routes/mukhyaSevikaRoutes.js) - sector visit entry ----------------
        getMukhyaSevikaEntries: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.fromDate) qs.set("fromDate", params.fromDate);
                if (params.toDate) qs.set("toDate", params.toDate);
                if (params.status) qs.set("status", params.status);
                const s = qs.toString();
                return `/mukhya-sevika${s ? `?${s}` : ""}`;
            },
            providesTags: ["MukhyaSevika"],
        }),
        createMukhyaSevikaEntry: builder.mutation({
            query: (data) => ({ url: "/mukhya-sevika", method: "POST", body: data }),
            invalidatesTags: ["MukhyaSevika"],
        }),
        reviewMukhyaSevikaEntry: builder.mutation({
            query: ({ id, status, remarks }) => ({
                url: `/mukhya-sevika/${id}/review`,
                method: "PATCH",
                body: { status, remarks },
            }),
            invalidatesTags: ["MukhyaSevika"],
        }),

        // ---------------- DASHBOARD (routes/dashboardRoutes.js) - sector roll-up ----------------
        // blockCode/sectorCode/awcCode are NEW - backend must accept these as
        // optional narrowing filters on top of the role-based auto-scope
        // (a block user is always scoped to their own block; these params let
        // them additionally narrow to one sector / one AWC within it).
        getDashboard: builder.query({
            query: ({
                level = "sector",
                districtCode = "",
                blockCode = "",
                sectorCode = "",
                awcCode = "",
                fromDate = "",
                toDate = "",
            } = {}) => {
                const qs = new URLSearchParams();

                // Dashboard level
                if (level) {
                    qs.set("level", level);
                }

                // Filters
                if (districtCode) {
                    qs.set("districtCode", districtCode);
                }

                if (blockCode) {
                    qs.set("blockCode", blockCode);
                }

                if (sectorCode) {
                    qs.set("sectorCode", sectorCode);
                }

                if (awcCode) {
                    qs.set("awcCode", awcCode);
                }

                // Date filters
                if (fromDate) {
                    qs.set("fromDate", fromDate);
                }

                if (toDate) {
                    qs.set("toDate", toDate);
                }

                const queryString = qs.toString();

                return `/dashboard${queryString ? `?${queryString}` : ""}`;
            },

            providesTags: ["Dashboard"],
        }),

        // ---------------- USERS (routes/userRoutes.js) ----------------
        getUsers: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.role) qs.set("role", params.role);
                if (params.status) qs.set("status", params.status);
                if (params.search) qs.set("search", params.search);
                const s = qs.toString();
                return `/users${s ? `?${s}` : ""}`;
            },
            providesTags: ["Users"],
        }),
        createUser: builder.mutation({
            query: (data) => ({ url: "/users", method: "POST", body: data }),
            invalidatesTags: ["Users"],
        }),
        updateUserStatus: builder.mutation({
            query: ({ id, status }) => ({ url: `/users/${id}/status`, method: "PATCH", body: { status } }),
            invalidatesTags: ["Users"],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
            invalidatesTags: ["Users"],
        }),

        // ---------------- TASKS (routes/taskRoutes.js) ----------------
        getTasks: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.status) qs.set("status", params.status);
                const s = qs.toString();
                return `/tasks${s ? `?${s}` : ""}`;
            },
            providesTags: ["Tasks"],
        }),
        createTask: builder.mutation({
            query: (data) => ({ url: "/tasks", method: "POST", body: data }),
            invalidatesTags: ["Tasks"],
        }),
        cancelTask: builder.mutation({
            query: (id) => ({ url: `/tasks/${id}/cancel`, method: "PATCH" }),
            invalidatesTags: ["Tasks"],
        }),

        // ---------------- TASK SUBMISSIONS (routes/taskSubmissionRoutes.js) ----------------
        getTaskSubmissions: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.taskId) qs.set("taskId", params.taskId);
                if (params.status) qs.set("status", params.status);
                const s = qs.toString();
                return `/task-submissions${s ? `?${s}` : ""}`;
            },
            providesTags: ["TaskSubmissions"],
        }),
        createTaskSubmission: builder.mutation({
            query: (data) => ({ url: "/task-submissions", method: "POST", body: data }),
            invalidatesTags: ["TaskSubmissions", "Tasks"],
        }),
        reviewTaskSubmission: builder.mutation({
            query: ({ id, status, remarks }) => ({
                url: `/task-submissions/${id}/review`,
                method: "PATCH",
                body: { status, remarks },
            }),
            invalidatesTags: ["TaskSubmissions"],
        }),

        // ---------------- GRADES (routes/gradeRoutes.js) ----------------
        getGrades: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.period) qs.set("period", params.period);
                const s = qs.toString();
                return `/grades${s ? `?${s}` : ""}`;
            },
            providesTags: ["Grades"],
        }),
        generateGrades: builder.mutation({
            query: (period) => ({ url: "/grades/generate", method: "POST", body: { period } }),
            invalidatesTags: ["Grades", "Notices"],
        }),
        updateGrade: builder.mutation({
            query: ({ id, ...body }) => ({ url: `/grades/${id}`, method: "PATCH", body }),
            invalidatesTags: ["Grades"],
        }),

        // ---------------- NOTICES (routes/noticeRoutes.js) ----------------
        getNotices: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.acknowledged !== undefined) qs.set("acknowledged", params.acknowledged);
                const s = qs.toString();
                return `/notices${s ? `?${s}` : ""}`;
            },
            providesTags: ["Notices"],
        }),
        acknowledgeNotice: builder.mutation({
            query: (id) => ({ url: `/notices/${id}/acknowledge`, method: "PATCH" }),
            invalidatesTags: ["Notices"],
        }),

        // ---------------- REPORTS (routes/reportRoutes.js) ----------------
        getHeatmap: builder.query({
            query: (params = {}) => {
                const qs = new URLSearchParams();
                if (params.period) qs.set("period", params.period);
                const s = qs.toString();
                return `/reports/heatmap${s ? `?${s}` : ""}`;
            },
        }),
    }),
});

// Download helper for the Excel/PDF report endpoints - these return a raw
// file stream (not JSON), so they're fetched directly rather than through
// RTK Query, and saved via a temporary object URL.
export async function downloadReport(path, filename) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { authorization: `Bearer ${getToken()}` },
    });
    if (res.status === 401) {
        handleSessionExpired();
        return;
    }
    if (!res.ok) throw new Error("Report download failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

export const {
    useRegisterUserMutation,
    useLoginUserMutation,
    useGetMeQuery,
    useLazyGetMeQuery,

    useGetDistrictsQuery,
    useCreateDistrictMutation,
    useGetBlocksQuery,
    useCreateBlockMutation,
    useGetSectorsQuery,
    useCreateSectorMutation,
    useGetAwcsQuery,
    useCreateAwcMutation,

    useUploadPhotosMutation,

    useGetRecordsQuery,
    useGetRecordsChildQuery,
    useCreateRecordMutation,
    useUpdateRecordMutation,
    useUpdateRecordPhotosMutation,
    useReviewRecordMutation,

    useGetMukhyaSevikaEntriesQuery,
    useCreateMukhyaSevikaEntryMutation,
    useReviewMukhyaSevikaEntryMutation,

    useGetDashboardQuery,

    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserStatusMutation,
    useDeleteUserMutation,

    useGetTasksQuery,
    useCreateTaskMutation,
    useCancelTaskMutation,

    useGetTaskSubmissionsQuery,
    useCreateTaskSubmissionMutation,
    useReviewTaskSubmissionMutation,

    useGetGradesQuery,
    useGenerateGradesMutation,
    useUpdateGradeMutation,

    useGetNoticesQuery,
    useAcknowledgeNoticeMutation,

    useGetHeatmapQuery,
} = api;