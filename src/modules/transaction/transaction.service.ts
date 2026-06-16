import { CreateTransactionsDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transactions, TransactionsDocument } from './schemas/transaction.schema';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { TransactionItems, TransactionItemsDocument } from '../transaction-item/schemas/transaction-item.schema';
import { DuesPeriods, DuesPeriodsDocument } from '../dues-periods/schemas/dues-periods.schema';
import { User, UserDocument } from '../users/schemas/users.schema';
import { RegionsService } from '../regions/regions.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transactions.name) private transactionModel: Model<TransactionsDocument>,
    @InjectModel(TransactionItems.name) private transactionItemsModel: Model<TransactionItemsDocument>,
    @InjectModel(DuesPeriods.name) private duesPeriodsModel: Model<DuesPeriodsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
    private regionsService: RegionsService,
  ) { }

  async findAll(filters?: {
    creatorId?: string;
    regionId?: string;
    month?: number;
    year?: number;
    accStatus?: string;
    paymentMethodId?: string;
  }) {
    const { creatorId, regionId, month, year, accStatus, paymentMethodId } = filters || {};

    const pipeline: any[] = [];

    if (creatorId) {
      pipeline.push({
        $match: {
          $or: [
            { creator_id: new Types.ObjectId(creatorId) },
            { creator_id: creatorId }
          ]
        }
      });
    }

    if (accStatus) {
      pipeline.push({ $match: { acc_status: accStatus } });
    }

    if (paymentMethodId) {
      pipeline.push({
        $match: {
          $or: [
            { payment_method_id: new Types.ObjectId(paymentMethodId) },
            { payment_method_id: paymentMethodId }
          ]
        }
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'transactionitems',
          localField: '_id',
          foreignField: 'transaction_id',
          as: 'items',
        },
      },
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
    );

    pipeline.push(
      {
        $addFields: {
          'items.period_id_obj': {
            $cond: { if: '$items.period_id', then: { $toObjectId: '$items.period_id' }, else: null }
          },
        },
      },
      {
        $lookup: {
          from: 'duesperiods',
          localField: 'items.period_id_obj',
          foreignField: '_id',
          as: 'items.period_id',
        },
      },
      {
        $addFields: {
          'items.period_id': { $arrayElemAt: ['$items.period_id', 0] },
        },
      },
    );

    pipeline.push(
      {
        $addFields: {
          'items.anggota_id_obj': {
            $cond: { if: '$items.anggota_id', then: { $toObjectId: '$items.anggota_id' }, else: null }
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'items.anggota_id_obj',
          foreignField: '_id',
          as: 'items.anggota_id',
        },
      },
      {
        $addFields: {
          'items.anggota_id': { $arrayElemAt: ['$items.anggota_id', 0] },
        },
      },
    );

    if (month || year) {
      const periodMatch: any = {};
      if (year) periodMatch['items.period_id.year'] = year;
      if (month && month > 0) periodMatch['items.period_id.month'] = month;
      if (Object.keys(periodMatch).length > 0) {
        pipeline.push({ $match: periodMatch });
      }
    }

    if (regionId) {
      const descendantIds = await this.regionsService.getDescendants(regionId);
      const regionObjectIds = descendantIds.map(id => new Types.ObjectId(id));

      pipeline.push(
        {
          $addFields: {
            creator_id_obj: { $toObjectId: '$creator_id' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'creator_id_obj',
            foreignField: '_id',
            as: 'creator',
          },
        },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { 'creator.region_id': { $in: regionObjectIds } },
              { 'creator.region_id': { $in: descendantIds } }
            ]
          }
        },
      );
    }

    pipeline.push(
      {
        $group: {
          _id: '$_id',
          creator_id: { $first: '$creator_id' },
          payment_method_id: { $first: '$payment_method_id' },
          status: { $first: '$status' },
          total_amount: { $first: '$total_amount' },
          acc_status: { $first: '$acc_status' },
          acc_by: { $first: '$acc_by' },
          acc_at: { $first: '$acc_at' },
          rejection_reason: { $first: '$rejection_reason' },
          is_synced: { $first: '$is_synced' },
          synced_at: { $first: '$synced_at' },
          created_at: { $first: '$created_at' },
          transaction_items: {
            $push: {
              $cond: [{ $not: ['$items._id'] }, '$$REMOVE', '$items']
            }
          },
        },
      },
      { $sort: { created_at: -1 } },
    );

    const transactions = await this.transactionModel.aggregate(pipeline);

    const totalAmount = transactions.reduce(
      (acc, t) => acc + (t.total_amount ?? 0),
      0,
    );

    return {
      meta: {
        month: month ?? null,
        year: year ?? null,
        generated_at: new Date(),
        total_transactions: transactions.length,
        ...(creatorId ? { creator_id: creatorId } : {}),
        ...(regionId ? { region_id: regionId } : {}),
      },
      summary: {
        total_amount: totalAmount,
        distribution: {
          pj: { percentage: 30, amount: totalAmount * 0.30 },
          pc: { percentage: 20, amount: totalAmount * 0.20 },
          pd: { percentage: 20, amount: totalAmount * 0.20 },
          pw: { percentage: 15, amount: totalAmount * 0.15 },
          pp: { percentage: 15, amount: totalAmount * 0.15 },
        },
      },
      data: transactions,
    };
  }

  async export(month: number, year: number, regionId?: string) {
    const matchStage: any = { 'period.year': year };
    if (month > 0) {
      matchStage['period.month'] = month;
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'transactionitems',
          localField: '_id',
          foreignField: 'transaction_id',
          as: 'items',
        },
      },
      { $unwind: '$items' },
      {
        $addFields: {
          'items.period_id_obj': {
            $toObjectId: '$items.period_id',
          },
        },
      },
      {
        $lookup: {
          from: 'duesperiods',
          localField: 'items.period_id_obj',
          foreignField: '_id',
          as: 'period',
        },
      },
      { $unwind: '$period' },
      {
        $match: matchStage,
      },
      {
        $addFields: {
          'items.anggota_id_obj': {
            $toObjectId: '$items.anggota_id',
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'items.anggota_id_obj',
          foreignField: '_id',
          as: 'member',
        },
      },
      { $unwind: '$member' },
      ...(regionId ? [{ $match: { 'member.region_id': new Types.ObjectId(regionId) } }] : []),
      {
        $project: {
          transaction_id: '$_id',
          created_at: 1,
          total_amount: 1,
          status: 1,
          acc_by: 1,
          acc_status: 1,
          member_name: '$member.fullname',
          npa: '$member.npa',
          period_month: '$period.month',
          period_year: '$period.year',
          item_status: '$items.status',
        },
      },
    ];

    const transactions = await this.transactionModel.aggregate(pipeline);

    const totalAmount = transactions.reduce(
      (acc, item) => acc + (item.total_amount ?? 0),
      0,
    );

    return {
      meta: {
        month,
        year,
        generated_at: new Date(),
        total_transactions: transactions.length,
        ...(regionId ? { region_id: regionId } : {}),
      },
      summary: {
        total_amount: totalAmount,
        distribution: {
          pj: { percentage: 30, amount: totalAmount * 0.30 },
          pc: { percentage: 20, amount: totalAmount * 0.20 },
          pd: { percentage: 20, amount: totalAmount * 0.20 },
          pw: { percentage: 15, amount: totalAmount * 0.15 },
          pp: { percentage: 15, amount: totalAmount * 0.15 },
        },
      },
      data: transactions,
    };
  }

  async findOne(id: string): Promise<TransactionsDocument> {
    const doc = this.transactionModel
      .findById(id)
      .populate({
        path: 'transaction_items',
        populate: [
          { path: 'anggota_id' },
          { path: 'period_id' },
        ],
      })
      .lean();
    if (!doc) throw new NotFoundException('Transaction not found');
    return doc;
  }

  async create(payload: CreateTransactionsDto): Promise<any> {
    const { items, ...transactionData } = payload;

    const pairs = items.map(i => ({
      anggota_id: new Types.ObjectId(i.anggota_id),
      period_id: new Types.ObjectId(i.period_id),
    }));

    const existingItems = await this.transactionItemsModel
      .find({ $or: pairs.map(p => ({ anggota_id: p.anggota_id, period_id: p.period_id })) })
      .select('_id transaction_id anggota_id period_id')
      .lean();

    if (existingItems.length > 0) {
      const existingTxnIds = [...new Set(existingItems.map(i => i.transaction_id))];
      const existingTxns = await this.transactionModel
        .find({ _id: { $in: existingTxnIds }, acc_status: { $ne: 'rejected' } })
        .select('_id')
        .lean();

      const blockedTxnIds = new Set(existingTxns.map(t => t._id.toString()));

      const blocked = existingItems.filter(i => blockedTxnIds.has(i.transaction_id.toString()));
      if (blocked.length > 0) {
        const blockedPeriods = blocked.map(i => i.period_id.toString());
        throw new ConflictException(
          `Bulan sudah dibayar untuk periode: ${blockedPeriods.join(', ')}`,
        );
      }
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {

      const created = await this.transactionModel.create(
        [transactionData as any],
        { session }
      );
      const newTransaction = created[0] as TransactionsDocument;

      const itemsWithHeaderId = items.map(item => ({
        ...item,
        transaction_id: newTransaction._id,
      }));

      const createdItems = await this.transactionItemsModel.create(
        itemsWithHeaderId as any[],
        { session, ordered: true }
      );

      await session.commitTransaction();
      const result = newTransaction.toObject();
      return { ...result, items: createdItems };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(id: string, payload: UpdateTransactionDto): Promise<TransactionsDocument> {
    const txn = await this.transactionModel.findById(id).exec();
    if (!txn) throw new NotFoundException('Transaction not found');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updated = await this.transactionModel
        .findByIdAndUpdate(id, payload, { new: true, session })
        .exec();

      if (payload.acc_status && payload.acc_status !== txn.acc_status) {
        const itemStatus = (payload.acc_status === 'acc_pc' || payload.acc_status === 'acc_pd')
          ? 'paid'
          : payload.acc_status === 'rejected'
            ? 'rejected'
            : null;

        if (itemStatus) {
          await this.transactionItemsModel.updateMany(
            { transaction_id: txn._id, status: 'pending' },
            { $set: { status: itemStatus, _active: itemStatus !== 'rejected' } },
            { session },
          );
        }
      }

      await session.commitTransaction();
      return updated!;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.transactionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Transaction not found');
    return { deleted: true };
  }

  async getMembersPaymentStatus(year: number, month?: number, regionId?: string) {
    const periodQuery: any = { year, is_active: true };
    if (month && month > 0) {
      periodQuery.month = month;
    }

    const periods = await this.duesPeriodsModel
      .find(periodQuery)
      .sort({ month: 1 })
      .lean();

    const userQuery: any = {};
    if (regionId) userQuery.region_id = new Types.ObjectId(regionId);

    const members = await this.userModel
      .find(userQuery)
      .select('_id fullname npa region_id role')
      .lean();

    const memberIds = members.map((m) => m._id);
    const periodIds = periods.map((p) => p._id);

    const items = await this.transactionItemsModel
      .find({
        anggota_id: { $in: memberIds },
        period_id: { $in: periodIds },
      })
      .lean();

    const transactionIds = [...new Set(items.map(i => i.transaction_id))];
    const transactions = await this.transactionModel
      .find({ _id: { $in: transactionIds } })
      .select('_id acc_status rejection_reason')
      .lean();

    const accStatusMap = new Map<string, string>();
    const rejectionReasonMap = new Map<string, string | null>();
    for (const txn of transactions) {
      const id = txn._id.toString();
      accStatusMap.set(id, txn.acc_status);
      rejectionReasonMap.set(id, txn.rejection_reason ?? null);
    }

    const itemMap = new Map<string, any>();
    for (const item of items) {
      const key = `${item.anggota_id}-${item.period_id}`;
      itemMap.set(key, item);
    }

    const now = new Date();
    const membersWithPayments = members.map((member) => {
      const payments = periods.map((period) => {
        const key = `${member._id}-${period._id}`;
        const item = itemMap.get(key);
        const txnAccStatus = item ? accStatusMap.get(item.transaction_id.toString()) : undefined;

        let status: 'paid' | 'tunggakan' | 'pending' | 'ditolak';
        if (
          item &&
          (txnAccStatus === 'acc_pc' || txnAccStatus === 'acc_pd')
        ) {
          status = 'paid';
        } else if (txnAccStatus === 'rejected') {
          status = 'ditolak';
        } else if (
          period.year < now.getFullYear() ||
          (period.year === now.getFullYear() && period.month < now.getMonth() + 1)
        ) {
          status = 'tunggakan';
        } else {
          status = 'pending';
        }

        return {
          month: period.month,
          year: period.year,
          period_id: period._id,
          amount: period.amount,
          status,
          transaction_id: item?.transaction_id ?? null,
          bukti_url: item?.bukti_url ?? null,
          rejection_reason: rejectionReasonMap.get(item?.transaction_id?.toString() ?? '') ?? null,
        };
      });

      return {
        _id: member._id,
        fullname: member.fullname,
        npa: member.npa,
        payments,
      };
    });

    return {
      meta: {
        year,
        region_id: regionId ?? null,
        generated_at: new Date(),
        total_members: members.length,
        last_updated: new Date(),
      },
      dues_periods: periods.map((p) => ({
        _id: p._id,
        month: p.month,
        year: p.year,
        amount: p.amount,
        is_active: p.is_active,
      })),
      members: membersWithPayments,
    };
  }
}
