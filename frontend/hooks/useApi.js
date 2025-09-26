import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export const useApi = (url, options = {}) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const {
        method = 'GET',
        body = null,
        dependencies = [],
        immediate = true
    } = options

    const execute = async (customOptions = {}) => {
        try {
            setLoading(true)
            setError(null)

            const config = {
                method: customOptions.method || method,
                ...customOptions
            }

            if (config.method !== 'GET' && (body || customOptions.body)) {
                config.data = customOptions.body || body
            }

            const response = await api({
                url: customOptions.url || url,
                ...config
            })

            setData(response.data)
            return response.data
        } catch (err) {
            setError(err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (immediate && url) {
            execute()
        }
    }, [url, immediate, ...dependencies])

    return {
        data,
        loading,
        error,
        execute,
        refetch: () => execute()
    }
}

export const useMutation = (mutationFn) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)

    const mutate = async (variables) => {
        try {
            setLoading(true)
            setError(null)
            const result = await mutationFn(variables)
            setData(result)
            return result
        } catch (err) {
            setError(err)
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
            throw err
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setData(null)
        setError(null)
        setLoading(false)
    }

    return {
        mutate,
        loading,
        error,
        data,
        reset
    }
}

export default useApi