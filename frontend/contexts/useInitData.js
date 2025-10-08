import { useEffect, useState } from 'react'
import api from '../services/api'

export const useInitData = (user) => {
    const [data, setData] = useState({
        academicYears: [],
        programs: [],
        organizations: [],
        notifications: [],
    })

    useEffect(() => {
        if (!user) return
        const fetchInit = async () => {
            const [years, programs, orgs, notif] = await Promise.all([
                api.get('/api/academic-years/all'),
                api.get('/api/programs'),
                api.get('/api/organizations'),
                api.get('/api/notifications?page=1&limit=5')
            ])
            setData({
                academicYears: years.data.data,
                programs: programs.data.data,
                organizations: orgs.data.data,
                notifications: notif.data.data
            })
        }
        fetchInit()
    }, [user])

    return data
}
