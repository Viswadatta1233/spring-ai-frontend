import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { dashboardProductsAction, fetchProducts, semanticSearchProducts } from "../store/actions";

const useProductFilter = () => {
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();

    useEffect(() => {
        const keyword = searchParams.get("keyword") || null;
        const searchType = searchParams.get("searchType");

        // Smart (semantic) search: a meaning-based ranked single page. The budget is
        // enforced via the maxPrice/minPrice metadata filter, NOT the query text.
        if (searchType === "smart" && keyword) {
            const minPrice = searchParams.get("minPrice") || null;
            const maxPrice = searchParams.get("maxPrice") || null;
            dispatch(semanticSearchProducts(keyword, { minPrice, maxPrice }));
            return;
        }

        const params = new URLSearchParams();

        const currentPage = searchParams.get("page")
            ? Number(searchParams.get("page"))
            : 1;

        params.set("pageNumber", currentPage - 1);

        const sortOrder = searchParams.get("sortby") || "asc";
        const categoryParams = searchParams.get("category") || null;
        params.set("sortBy","price");
        params.set("sortOrder", sortOrder);

        if (categoryParams) {
            params.set("category", categoryParams);
        }

        if (keyword) {
            params.set("keyword", keyword);
        }

        const queryString = params.toString();
        console.log("QUERY STRING", queryString);
        
        dispatch(fetchProducts(queryString));

    }, [dispatch, searchParams]);
};


export const useDashboardProductFilter = () => {

    const { user } = useSelector((state) => state.auth);
    const isAdmin = user && user?.roles?.includes("ROLE_ADMIN");

    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();

    useEffect(() => {
        const params = new URLSearchParams();

        const currentPage = searchParams.get("page")
            ? Number(searchParams.get("page"))
            : 1;

        params.set("pageNumber", currentPage - 1);

        const queryString = params.toString();
        dispatch(dashboardProductsAction(queryString, isAdmin));

    }, [dispatch, searchParams]);
};

export default useProductFilter;