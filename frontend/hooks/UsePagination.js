import { useState, useMemo } from 'react'

export const usePagination = ({
                                  totalItems,
                                  itemsPerPage = 10,
                                  initialPage = 1
                              }) => {
    const [currentPage, setCurrentPage] = useState(initialPage)

    const paginationInfo = useMemo(() => {
        const totalPages = Math.ceil(totalItems / itemsPerPage)
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1)

        return {
            totalPages,
            currentPage,
            totalItems,
            itemsPerPage,
            startIndex,
            endIndex,
            startItem: startIndex + 1,
            endItem: endIndex + 1,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        }
    }, [totalItems, itemsPerPage, currentPage])

    const goToPage = (page) => {
        if (page >= 1 && page <= paginationInfo.totalPages) {
            setCurrentPage(page)
        }
    }

    const nextPage = () => {
        if (paginationInfo.hasNext) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const prevPage = () => {
        if (paginationInfo.hasPrev) {
            setCurrentPage(prev => prev - 1)
        }
    }

    const reset = () => {
        setCurrentPage(initialPage)
    }

    return {
        ...paginationInfo,
        goToPage,
        nextPage,
        prevPage,
        reset
    }
}

export default usePagination