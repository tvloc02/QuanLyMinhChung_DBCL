const Evidence = require('../models/Evidence');
const File = require('../models/File');
const { Program, Organization, Standard, Criteria } = require('../models/Program');
const User = require('../models/User');

// Advanced search across evidences
const searchEvidences = async (searchParams, userPermissions) => {
    try {
        const {
            keyword,
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

        // Build base query
        let query = {};

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
        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

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
        if (createdBy) query.createdBy = createdBy;

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
const searchInFiles = async (keyword, userPermissions) => {
    try {
        if (!keyword || keyword.trim().length < 2) {
            return {
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            };
        }

        // Find files with matching content
        const keywordRegex = new RegExp(keyword, 'i');
        const files = await File.find({
            status: 'active',
            extractedContent: keywordRegex
        })
            .populate({
                path: 'evidenceId',
                populate: [
                    { path: 'programId', select: 'name code' },
                    { path: 'organizationId', select: 'name code' },
                    { path: 'standardId', select: 'name code' },
                    { path: 'criteriaId', select: 'name code' }
                ]
            })
            .populate('uploadedBy', 'fullName email')
            .limit(50);

        // Filter by user permissions
        const filteredFiles = files.filter(file => {
            if (!file.evidenceId) return false;

            if (userPermissions.role === 'admin') return true;

            const hasStandardAccess = userPermissions.standardAccess?.includes(file.evidenceId.standardId?._id?.toString());
            const hasCriteriaAccess = userPermissions.criteriaAccess?.includes(file.evidenceId.criteriaId?._id?.toString());

            return hasStandardAccess || hasCriteriaAccess;
        });

        // Extract relevant text snippets
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
                    criteria: file.evidenceId.criteriaId?.name
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
                keyword
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
const globalSearch = async (keyword, userPermissions) => {
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

        // Search evidences
        const evidenceQuery = {
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
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .select('code name description')
            .limit(10);

        // Search programs (if user has access)
        if (userPermissions.role !== 'staff') {
            results.programs = await Program.find({
                $or: [
                    { name: keywordRegex },
                    { code: keywordRegex },
                    { description: keywordRegex }
                ]
            }).select('code name description').limit(10);
        }

        // Search standards
        results.standards = await Standard.find({
            $or: [
                { name: keywordRegex },
                { code: keywordRegex },
                { description: keywordRegex }
            ]
        })
            .populate('programId', 'name')
            .select('code name description programId')
            .limit(10);

        // Search criteria
        results.criteria = await Criteria.find({
            $or: [
                { name: keywordRegex },
                { code: keywordRegex },
                { description: keywordRegex }
            ]
        })
            .populate('standardId', 'name code')
            .select('code name description standardId')
            .limit(10);

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
        const fileSearchResult = await searchInFiles(keyword, userPermissions);
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
                keyword
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
const getSearchSuggestions = async (keyword, userPermissions) => {
    try {
        if (!keyword || keyword.trim().length < 1) {
            return { success: true, data: [] };
        }

        const keywordRegex = new RegExp(keyword, 'i');
        const suggestions = [];

        // Get evidence suggestions
        const evidences = await Evidence.find({
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

// Save search query for analytics
const saveSearchQuery = async (keyword, userId, resultCount) => {
    try {
        // This could be stored in a separate SearchLog collection
        // For now, just log to console
        console.log(`Search query: "${keyword}" by user ${userId}, ${resultCount} results`);

        // You could implement search analytics here:
        // - Popular search terms
        // - Search success rate
        // - User search patterns

    } catch (error) {
        console.error('Save search query error:', error);
    }
};

// Get popular search terms
const getPopularSearchTerms = async (limit = 10) => {
    try {
        // This would require a SearchLog collection
        // For now, return mock data
        return [
            { keyword: 'quyết định', count: 150 },
            { keyword: 'báo cáo', count: 120 },
            { keyword: 'kế hoạch', count: 95 },
            { keyword: 'thông tư', count: 80 },
            { keyword: 'nghị định', count: 70 }
        ];
    } catch (error) {
        console.error('Get popular search terms error:', error);
        return [];
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

module.exports = {
    searchEvidences,
    searchInFiles,
    globalSearch,
    getSearchSuggestions,
    saveSearchQuery,
    getPopularSearchTerms,
    facetedSearch
};