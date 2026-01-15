import { Request, Response, NextFunction } from 'express';
import { findTotalCampaignListByUserId } from '../services/campaign.service';
import { findActiveCampaignListByAdmin } from '../services/campaign.service';
import { findTotalPromotersListByUserId } from '../services/campaign.service';
import { findTotalPoolListByUserId } from '../services/pool.service';
import { findUserByCondition } from '../services/user.service';
import { findRecentActivityByUserId } from '../services/activity.service';
import { findRecentFlowrateByUserId } from '../services/flowrate.service';
import { findTopPromoterList } from '../services/user.service';
import { findJoinListByUserId } from '../services/join.service';
import { findUserListByCampaignList } from '../services/join.service';

export const getAdminDashboardHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const userId = Number(req.params.userId);

        if (isNaN(userId)) {
            res.status(400).json({
                result: false,
                error: 'Invalid User ID'
            });
            return;
        }

        const totalCampaignList = await findTotalCampaignListByUserId(userId);
        const userList = await findUserListByCampaignList(totalCampaignList.map((campaign: any) => campaign.id));
        const activeCampaignList = await findActiveCampaignListByAdmin(userId);
        const totalPromotersList = await findTotalPromotersListByUserId(userId);
        const poolList = await findTotalPoolListByUserId(userId);

        const total_promoters = totalPromotersList.reduce((acc: number, curr: any) => acc + curr.promoters, 0);
        const total_old_promoters = totalPromotersList.reduce((acc: number, curr: any) => acc + curr.old_promoters, 0);
        let total_promoters_growth = total_old_promoters > 0 ? (total_promoters - total_old_promoters) * 100 / total_old_promoters : (total_promoters - total_old_promoters) * 100;
        total_promoters_growth = parseFloat(total_promoters_growth.toFixed(2));
        const total = userList.length;
        const banned = userList.filter((user: any) => user?.is_ban).length;
        const active = total - banned;

        res.status(200).json({
            result: true,
            dashboard: {
                stats: {
                    total_campaigns: totalCampaignList.length,
                    active_campaigns: activeCampaignList.length,
                    total_promoters: total_promoters,
                    total_promoters_growth: total_promoters_growth,
                    pool_list: poolList
                },
                active_campaign_list: activeCampaignList,
                users: {
                    total: total,
                    active: active,
                    banned: banned
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to get dashboard data'
        });
    }
}

export const getPromoterDashboardHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const userId = Number(req.params.userId);

        if (isNaN(userId)) {
            res.status(400).json({
                result: false,
                error: 'Invalid User ID'
            });
        }

        const user = await findUserByCondition({
            id: userId,
            account_type: "Promoter"
        });

        const activeCampaignList = await findJoinListByUserId(userId);
        const recentActivityList = await findRecentActivityByUserId(userId);
        const recentFlowrate = await findRecentFlowrateByUserId(userId);
        const topPromoterList = await findTopPromoterList();

        if (!user) {
            res.status(404).json({
                result: false,
                error: 'User not found'
            });
            return;
        }

        res.status(200).json({
            result: true,
            dashboard: {
                active_campaign_list: activeCampaignList,
                activity_list: recentActivityList,
                flow_rate_list: recentFlowrate.flow_rates,
                top_promoter_list: topPromoterList
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to get dashboard data'
        });
    }
}
