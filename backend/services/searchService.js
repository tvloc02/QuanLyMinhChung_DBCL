const mongoose = require('mongoose');
const Evidence = require('../models/Evidence/Evidence');
const File = require('../models/Evidence/File');
const { Program, Organization, Standard, Criteria } = require('../models/Evidence/Program');
const User = require('../models/User/User');

// Advanced search across evidences
const searchEvidences = async (searchParams, userPermissions) => {
    try {
        const {
            keyword,
            academicYearId, // Required academic year context
            programId,
            organizationId,
            standardId,
            criteriaId,
            status,
            documentType,
            dateFrom,
            dateTo,
            tags,
            createdBy,
            issuingAgency,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = searchParams;

        // Build base query with required academicYearId
        let query = {};
        if (academicYearId) {
            query.academicYearId = mongoose.Types.ObjectId(academicYearId);
        }

        // Apply user permissions
        if (userPermissions.role !== 'admin') {
            const accessibleStandards = userPermissions.standardAccess || [];
            const accessibleCriteria = userPermissions.criteriaAccess || [];

            if (accessibleStandards.length > 0 || accessibleCriteria.length > 0) {
                query.$or = [];
                if (accessibleStandards.length > 0) {
                    query.$or.push({ standardId: { $in: accessibleStandards } });
                }
                if (accessibleCriteria.length > 0) {
                    query.$or.push({ criteriaId: { $in: accessibleCriteria } });
                }
            } else {
                // No permissions, return empty result
                return {
                    evidences: [],
                    total: 0,
                    page: parseInt(page),
                    totalPages: 0
                };
            }
        }

        // Text search
        if (keyword) {
            const keywordRegex = new RegExp(keyword, 'i');
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: keywordRegex },
                    { description: keywordRegex },
                    { code: keywordRegex },
                    { documentNumber: keywordRegex },
                    { issuingAgency: keywordRegex },
                    { notes: keywordRegex }
                ]
            });
        }

        // Filter by program/organization/standard/criteria
        if (programId) query.programId = mongoose.Types.ObjectId(programId);
        if (organizationId) query.organizationId = mongoose.Types.ObjectId(organizationId);
        if (standardId) query.standardId = mongoose.Types.ObjectId(standardId);
        if (criteriaId) query.criteriaId = mongoose.Types.ObjectId(criteriaId);

        // Filter by status
        if (status) query.status = status;

        // Filter by document type
        if (documentType) query.documentType = documentType;

        // Date range filter
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        // Filter by tags
        if (tags && tags.length > 0) {
            query.tags = { $in: tags };
        }

        // Filter by creator
        if (createdBy) query.createdBy = mongoose.Types.ObjectId(createdBy);

        // Filter by issuing agency
        if (issuingAgency) {
            query.issuingAgency = new RegExp(issuingAgency, 'i');
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute search
        const [evidences, total] = await Promise.all([
            Evidence.find(query)
                .populate('academicYearId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('files', 'originalName size mimeType')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Evidence.countDocuments(query)
        ]);

        return {
            evidences,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasNext: pageNum * limitNum < total,
            hasPrev: pageNum > 1
        };

    } catch (error) {
        console.error('Search evidences error:', error);
        throw error;
    }
};

// Search in file contents
const searchInFiles = async (keyword, userPermissions, academicYearId = null) => {
    try {
        if (!keyword || keyword.trim().length < 2) {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            };
        }

        // Build query for files
        let fileQuery = {
            status: 'active',
            extractedContent: new RegExp(keyword, 'i')
        };

        // Find files with matching content
        let files = await File.find(fileQuery)
            .populate({
                path: 'evidenceId',
                populate: [
                    { path: 'academicYearId', select: 'name code' },
                    { path: 'programId', select: 'name code' },
                    { path: 'organizationId', select: 'name code' },
                    { path: 'standardId', select: 'name code' },
                    { path: 'criteriaId', select: 'name code' }
                ]
            })
            .populate('uploadedBy', 'fullName email')
            .limit(50);

        // Filter by academic year if specified
        if (academicYearId) {
            files = files.filter(file =>
                file.evidenceId &&
                file.evidenceId.academicYearId &&
                file.evidenceId.academicYearId._id.toString() === academicYearId.toString()
            );
        }

        // Filter by user permissions
        const filteredFiles = files.filter(file => {
            if (!file.evidenceId) return false;

            if (userPermissions.role === 'admin') return true;

            const hasStandardAccess = userPermissions.standardAccess?.includes(file.evidenceId.standardId?._id?.toString());
            const hasCriteriaAccess = userPermissions.criteriaAccess?.includes(file.evidenceId.criteriaId?._id?.toString());

            return hasStandardAccess || hasCriteriaAccess;
        });

        // Extract relevant text snippets
        const keywordRegex = new RegExp(keyword, 'i');
        const results = filteredFiles.map(file => {
            const snippet = extractSnippet(file.extractedContent, keyword);
            return {
                file: {
                    _id: file._id,
                    originalName: file.originalName,
                    size: file.size,
                    mimeType: file.mimeType,
                    uploadedAt: file.uploadedAt
                },
                evidence: {
                    _id: file.evidenceId._id,
                    code: file.evidenceId.code,
                    name: file.evidenceId.name,
                    program: file.evidenceId.programId?.name,
                    organization: file.evidenceId.organizationId?.name,
                    standard: file.evidenceId.standardId?.name,
                    criteria: file.evidenceId.criteriaId?.name,
                    academicYear: file.evidenceId.academicYearId?.name
                },
                snippet,
                matchCount: (file.extractedContent.match(keywordRegex) || []).length
            };
        });

        // Sort by relevance (match count)
        results.sort((a, b) => b.matchCount - a.matchCount);

        return {
            success: true,
            data: {
                results,
                total: results.length,
                keyword,
                academicYearId
            }
        };

    } catch (error) {
        console.error('Search in files error:', error);
        return {
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm trong file'
        };
    }
};

// Extract text snippet around keyword
const extractSnippet = (text, keyword, contextLength = 100) => {
    if (!text) return '';

    const keywordRegex = new RegExp(keyword, 'i');
    const match = text.match(keywordRegex);

    if (!match) return text.substring(0, contextLength * 2) + '...';

    const index = match.index;
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + keyword.length + contextLength);

    let snippet = text.substring(start, end);

    // Add ellipsis if needed
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    // Highlight keyword
    snippet = snippet.replace(keywordRegex, `**${match[0]}**`);

    return snippet;
};

// Global search across all entities
const globalSearch = async (keyword, userPermissions, academicYearId = null) => {
    try {
        if (!keyword || keyword.trim().length < 2) {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            };
        }

        const keywordRegex = new RegExp(keyword, 'i');
        const results = {
            evidences: [],
            files: [],
            programs: [],
            standards: [],
            criteria: [],
            users: []
        };

        // Build base query with academic year filter
        let baseQuery = {};
        if (academicYearId) {
            baseQuery.academicYearId = mongoose.Types.ObjectId(academicYearId);
        }

        // Search evidences
        const evidenceQuery = {
            ...baseQuery,
            $or: [
                { name: keywordRegex },
                { description: keywordRegex },
                { code: keywordRegex },
                { documentNumber: keywordRegex }
            ]
        };

        // Apply permissions for evidences
        if (userPermissions.role !== 'admin') {
            const accessibleStandards = userPermissions.standardAccess || [];
            const accessibleCriteria = userPermissions.criteriaAccess || [];

            if (accessibleStandards.length > 0 || accessibleCriteria.length > 0) {
                evidenceQuery.$and = [{
                    $or: [
                        { standardId: { $in: accessibleStandards } },
                        { criteriaId: { $in: accessibleCriteria } }
                    ]
                }];
            } else {
                evidenceQuery._id = { $in: [] }; // No results
            }
        }

        results.evidences = await Evidence.find(evidenceQuery)
            .populate('academicYearId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .select('code name description academicYearId standardId criteriaId')
            .limit(10);

        // Search programs (if user has access and academic year context)
        if (userPermissions.role !== 'staff' && academicYearId) {
            results.programs = await Program.find({
                ...baseQuery,
                $or: [
                    { name: keywordRegex },
                    { code: keywordRegex },
                    { description: keywordRegex }
                ]
            })
                .populate('academicYearId', 'name code')
                .select('code name description academicYearId')
                .limit(10);
        }

        // Search standards (with academic year context)
        if (academicYearId) {
            results.standards = await Standard.find({
                ...baseQuery,
                $or: [
                    { name: keywordRegex },
                    { code: keywordRegex },
                    { description: keywordRegex }
                ]
            })
                .populate('academicYearId', 'name code')
                .populate('programId', 'name')
                .select('code name description academicYearId programId')
                .limit(10);

            // Search criteria (with academic year context)
            results.criteria = await Criteria.find({
                ...baseQuery,
                $or: [
                    { name: keywordRegex },
                    { code: keywordRegex },
                    { description: keywordRegex }
                ]
            })
                .populate('academicYearId', 'name code')
                .populate('standardId', 'name code')
                .select('code name description academicYearId standardId')
                .limit(10);
        }

        // Search users (admin and manager only)
        if (['admin', 'manager'].includes(userPermissions.role)) {
            results.users = await User.find({
                $or: [
                    { fullName: keywordRegex },
                    { email: keywordRegex },
                    { department: keywordRegex },
                    { position: keywordRegex }
                ]
            }).select('fullName email department position role').limit(10);
        }

        // Search files
        const fileSearchResult = await searchInFiles(keyword, userPermissions, academicYearId);
        if (fileSearchResult.success) {
            results.files = fileSearchResult.data.results.slice(0, 10);
        }

        // Calculate total results
        const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

        return {
            success: true,
            data: {
                results,
                totalResults,
                keyword,
                academicYearId
            }
        };

    } catch (error) {
        console.error('Global search error:', error);
        return {
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm'
        };
    }
};

// Get search suggestions
const getSearchSuggestions = async (keyword, userPermissions, academicYearId = null) => {
    try {
        if (!keyword || keyword.trim().length < 1) {
            return { success: true, data: [] };
        }

        const keywordRegex = new RegExp(keyword, 'i');
        const suggestions = [];

        // Build base query
        let baseQuery = {};
        if (academicYearId) {
            baseQuery.academicYearId = mongoose.Types.ObjectId(academicYearId);
        }

        // Get evidence suggestions
        const evidences = await Evidence.find({
            ...baseQuery,
            $or: [
                { name: keywordRegex },
                { code: keywordRegex }
            ]
        }).select('code name').limit(5);

        evidences.forEach(evidence => {
            suggestions.push({
                type: 'evidence',
                label: `${evidence.code} - ${evidence.name}`,
                value: evidence.name,
                id: evidence._id
            });
        });

        // Get tag suggestions
        const evidencesWithTags = await Evidence.find({
            ...baseQuery,
            tags: keywordRegex
        }).select('tags').limit(10);

        const tagSet = new Set();
        evidencesWithTags.forEach(evidence => {
            evidence.tags.forEach(tag => {
                if (tag.toLowerCase().includes(keyword.toLowerCase())) {
                    tagSet.add(tag);
                }
            });
        });

        Array.from(tagSet).slice(0, 5).forEach(tag => {
            suggestions.push({
                type: 'tag',
                label: tag,
                value: tag
            });
        });

        return {
            success: true,
            data: suggestions.slice(0, 10)
        };

    } catch (error) {
        console.error('Get search suggestions error:', error);
        return {
            success: false,
            message: 'Lỗi khi lấy gợi ý tìm kiếm'
        };
    }
};

// Search with filters and facets
const facetedSearch = async (searchParams, userPermissions) => {
    try {
        const searchResult = await searchEvidences(searchParams, userPermissions);

        // Get facets (counts by different categories)
        const facets = await getFacets(searchParams, userPermissions);

        return {
            ...searchResult,
            facets
        };

    } catch (error) {
        console.error('Faceted search error:', error);
        throw error;
    }
};

// Get search facets
const getFacets = async (searchParams, userPermissions) => {
    try {
        // Build base query (similar to searchEvidences but without pagination)
        let query = {};

        // Include academic year filter
        if (searchParams.academicYearId) {
            query.academicYearId = mongoose.Types.ObjectId(searchParams.academicYearId);
        }

        // Apply user permissions
        if (userPermissions.role !== 'admin') {
            const accessibleStandards = userPermissions.standardAccess || [];
            const accessibleCriteria = userPermissions.criteriaAccess || [];

            if (accessibleStandards.length > 0 || accessibleCriteria.length > 0) {
                query.$or = [];
                if (accessibleStandards.length > 0) {
                    query.$or.push({ standardId: { $in: accessibleStandards } });
                }
                if (accessibleCriteria.length > 0) {
                    query.$or.push({ criteriaId: { $in: accessibleCriteria } });
                }
            }
        }

        // Apply existing filters (except the ones we're getting facets for)
        if (searchParams.keyword) {
            const keywordRegex = new RegExp(searchParams.keyword, 'i');
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: keywordRegex },
                    { description: keywordRegex },
                    { code: keywordRegex },
                    { documentNumber: keywordRegex }
                ]
            });
        }

        // Get facets
        const facets = {};

        // Status facets
        const statusFacets = await Evidence.aggregate([
            { $match: query },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        facets.status = statusFacets;

        // Document type facets
        const documentTypeFacets = await Evidence.aggregate([
            { $match: query },
            { $group: { _id: '$documentType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        facets.documentType = documentTypeFacets;

        // Year facets
        const yearFacets = await Evidence.aggregate([
            { $match: query },
            { $group: { _id: { $year: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);
        facets.year = yearFacets;

        return facets;

    } catch (error) {
        console.error('Get facets error:', error);
        return {};
    }
};

// Save search query for analytics
const saveSearchQuery = async (keyword, userId, resultCount, academicYearId = null) => {
    try {
        // This could be stored in a separate SearchLog collection
        // For now, just log to console
        console.log(`Search query: "${keyword}" by user ${userId} in academic year ${academicYearId}, ${resultCount} results`);

        // You could implement search analytics here:
        // - Popular search terms by academic year
        // - Search success rate
        // - User search patterns

    } catch (error) {
        console.error('Save search query error:', error);
    }
};

// Get popular search terms
const getPopularSearchTerms = async (academicYearId = null, limit = 10) => {
    try {
        // This would require a SearchLog collection
        // For now, return mock data
        return [
            { keyword: 'quyết định', count: 150, academicYearId },
            { keyword: 'báo cáo', count: 120, academicYearId },
            { keyword: 'kế hoạch', count: 95, academicYearId },
            { keyword: 'thông tư', count: 80, academicYearId },
            { keyword: 'nghị định', count: 70, academicYearId }
        ];
    } catch (error) {
        console.error('Get popular search terms error:', error);
        return [];
    }
};

module.exports = {
    searchEvidences,
    searchInFiles,
    globalSearch,
    getSearchSuggestions,
    saveSearchQuery,
    getPopularSearchTerms,
    facetedSearch
};