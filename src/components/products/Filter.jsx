import { Button, FormControl, InputLabel, MenuItem, Select, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { FiArrowDown, FiArrowUp, FiRefreshCw, FiSearch } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const Filter = ({ categories }) => {
    const [searchParams] = useSearchParams();
    const params = new URLSearchParams(searchParams);
    const pathname = useLocation().pathname;
    const navigate = useNavigate();
    
    const [category, setCategory] = useState("all");
    const [sortOrder, setSortOrder] = useState("asc");
    const [searchTerm, setSearchTerm] = useState("");
    const [smartSearch, setSmartSearch] = useState(false);
    const [maxPrice, setMaxPrice] = useState("");

    useEffect(() => {
        const currentCategory = searchParams.get("category") || "all";
        const currentSortOrder = searchParams.get("sortby") || "asc";
        const currentSearchTerm = searchParams.get("keyword") || "";
        const currentSmartSearch = searchParams.get("searchType") === "smart";
        const currentMaxPrice = searchParams.get("maxPrice") || "";

        setCategory(currentCategory);
        setSortOrder(currentSortOrder);
        setSearchTerm(currentSearchTerm);
        setSmartSearch(currentSmartSearch);
        setMaxPrice(currentMaxPrice);
    }, [searchParams]);

    useEffect(() => { 
        const handler = setTimeout(() => {
            const next = new URLSearchParams(searchParams);
            if (searchTerm) {
                next.set("keyword", searchTerm);
            } else {
                next.delete("keyword");
            }
            // maxPrice is only meaningful (and only sent) in smart-search mode.
            if (smartSearch && maxPrice) {
                next.set("maxPrice", maxPrice);
            } else {
                next.delete("maxPrice");
            }
            navigate(`${pathname}?${next.toString()}`);
        }, 700);

        return () => {
            clearTimeout(handler);
        };
    }, [searchParams, searchTerm, maxPrice, smartSearch, navigate, pathname]);

    const handleCategoryChange = (event) => {
        const selectedCategory = event.target.value;

        if (selectedCategory === "all") {
            params.delete("category");
        } else {
            params.set("category", selectedCategory);
        }
        navigate(`${pathname}?${params}`);
        setCategory(event.target.value);
    };

    const toggleSortOrder = () => {
        setSortOrder((prevOrder) => {
            const newOrder = (prevOrder === "asc") ?  "desc" : "asc";
            params.set("sortby", newOrder);
            navigate(`${pathname}?${params}`);
            return newOrder;
        })
    };

    const toggleSmartSearch = () => {
        if (smartSearch) {
            // Back to standard keyword search.
            params.delete("searchType");
            params.delete("maxPrice");
        } else {
            // Semantic search has its own relevance ranking; category/sort/page
            // do not apply, so drop them for a clean result set.
            params.set("searchType", "smart");
            params.delete("category");
            params.delete("sortby");
            params.delete("page");
        }
        navigate(`${pathname}?${params}`);
        setSmartSearch((prev) => !prev);
    };

    const handleClearFilters = () => {
        navigate({ pathname : window.location.pathname });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex lg:flex-row flex-col-reverse lg:justify-between justify-center items-center gap-4">
                {/* SEARCH BAR */}
                <div className="relative flex items-center 2xl:w-[450px] sm:w-[420px] w-full">
                    <input 
                        type="text"
                        placeholder={smartSearch ? "Describe what you need, e.g. beginner home gym equipment" : "Search Products"}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`border text-slate-800 rounded-md py-2 pl-10 pr-4 w-full focus:outline-hidden focus:ring-2 ${
                            smartSearch
                                ? "border-purple-500 focus:ring-purple-500"
                                : "border-gray-400 focus:ring-[#1976d2]"
                        }`}/>
                    {smartSearch ? (
                        <HiSparkles className="absolute left-3 text-purple-600" size={20}/>
                    ) : (
                        <FiSearch className="absolute left-3 text-slate-800" size={20}/>
                    )}
                </div>

                {/* CATEGORY SELECTION */}
                <div className="flex sm:flex-row flex-col gap-4 items-center">
                    {/* SMART SEARCH TOGGLE */}
                    <Tooltip title={smartSearch ? "Smart (AI) search is ON — results are ranked by meaning" : "Turn on AI Smart Search to search by meaning"}>
                        <Button
                            variant={smartSearch ? "contained" : "outlined"}
                            onClick={toggleSmartSearch}
                            color="secondary"
                            className="flex items-center gap-2 h-10"
                            startIcon={<HiSparkles size={18} />}>
                            {smartSearch ? "Smart: ON" : "Smart Search"}
                        </Button>
                    </Tooltip>

                    <FormControl
                        className="text-slate-800 border-slate-700"
                        variant="outlined"
                        size="small"
                        disabled={smartSearch}>
                            <InputLabel id="category-select-label">Category</InputLabel>
                            <Select
                                labelId="category-select-label"
                                value={category}
                                onChange={handleCategoryChange}
                                label="Category"
                                className="min-w-[120px] text-slate-800 border-slate-700"
                             >
                                <MenuItem value="all">All</MenuItem>
                                {categories.map((item) => (
                                    <MenuItem key={item.categoryId} value={item.categoryName}>
                                        {item.categoryName}
                                    </MenuItem>
                                ))}
                             </Select>
                    </FormControl>

                    {/* SORT BUTTON & CLEAR FILTER */}
                    <Tooltip title="Sorted by price: asc">
                        <span>
                            <Button variant="contained" 
                                onClick={toggleSortOrder}
                                color="primary" 
                                disabled={smartSearch}
                                className="flex items-center gap-2 h-10">
                                Sort By
                                {sortOrder === "asc" ? (
                                    <FiArrowUp size={20} />
                                ) : (
                                    <FiArrowDown size={20} />
                                )}
                                
                            </Button>
                        </span>
                    </Tooltip>
                    <button 
                    className="flex items-center gap-2 bg-rose-900 text-white px-3 py-2 rounded-md transition duration-300 ease-in shadow-md focus:outline-hidden"
                    onClick={handleClearFilters}
                    >
                        <FiRefreshCw className="font-semibold" size={16}/>
                        <span className="font-semibold">Clear Filter</span>
                    </button>
                </div>
            </div>

            {/* SMART SEARCH OPTIONS */}
            {smartSearch && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-purple-50 border border-purple-200 rounded-md px-4 py-3">
                    <div className="flex items-center gap-2 text-purple-700 text-sm font-medium">
                        <HiSparkles size={18} />
                        <span>AI Smart Search ranks products by meaning.</span>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <label htmlFor="max-price" className="text-sm text-slate-700 whitespace-nowrap">
                            Max price ($)
                        </label>
                        <input
                            id="max-price"
                            type="number"
                            min="0"
                            placeholder="e.g. 5000"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="border border-purple-300 text-slate-800 rounded-md py-1.5 px-3 w-32 focus:outline-hidden focus:ring-2 focus:ring-purple-500"/>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Filter;
