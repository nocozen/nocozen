declare namespace Fetch {
  interface FetchResult {
    msg: string
  }

  interface LoginResult extends FetchResult {
    _id: string,
    token: string,
    account: any
  }

  interface DistinctOption {
    metaid?: string,
    dbname?: string,
    collection: string,
    field: string,
    filter?: Object,
    option?: Object
  }

  // 查询
  interface FindOption {
    metaid?: string,
    dbname?: string,
    collection?: string,
    filterType?: string,
    filter?: any,
    sort?: any,
    page?: number,
    size?: number,
    projection?: any,
    datatype?: "array" | "object"
  }

  interface FindResult extends FetchResult {
    data: Array<any>,
    count?: number
  }

  interface BulkMeta {
    field: string,  // excel列名称：col0、col1...
    fieldName: string, // 字段元数据名称：_mf_xxxxx
    title: string, // 字段中文名
    type: string  // 字段类型：FormElType: FeText...
  }

  interface BulkUpsertOption {
    metaid?: string,
    dbname?: string,
    collection: string,
    docs: Array<any>,
    meta?: Array<BulkMeta>,
    options?: any,   // 批量插入时防止在数组中上一个文档插入失败时插入其余文档。
    type?: "insert" | "update",
    hash?: boolean,  // 是否启用hash校验, 默认：false
    convert?: boolean,  // 是否启用类型转换；默认: true
  }

  // 插入
  interface InsertOption {
    metaid?: string,
    dbname?: string,
    collection?: string,
    docs: Array<any>,
    options?: any,   // 批量插入时防止在数组中上一个文档插入失败时插入其余文档。
  }
  interface InsertReturn {
    acknowledged: boolean,
    insertedCount: number,
    insertedIds: Array<any>,  // api 请求参数中增加是否需要提供的属性
    insertedUids: Array<any>  // api 请求参数中增加是否需要提供的属性
  }
  interface InsertResult extends FetchResult {
    data: InsertReturn,
  }

  // 更新
  interface UpdateOption {
    metaid?: string,
    dbname?: string,
    collection?: string,
    filter?: {
      _id?: string,
      [k: string]: any,
    },
    update?: any,
    push?: any,
    addToSet?: any,
    pull?: any,
    options?: any,   // 批量插入时防止在数组中上一个文档插入失败时插入其余文档。
    formData?: any       // 附属数据，流程实例关联的数据，流程结束后日志和同步需要；
  }

  interface UpdateReturn {
    acknowledged: boolean,
    matchedCount: number,   // The number of documents that matched the filter
    modifiedCount: number,    // The number of documents that were modified
    upsertedCount: number,    // The number of documents that were upserted
    upsertedId: string,   // The identifier of the inserted document if an upsert took place
  }
  interface UpdateResult extends FetchResult {
    data: UpdateReturn | null | any,
  }

  // 删除
  interface DeleteOption {
    metaid?: string,
    dbname?: string,
    collection?: string,
    filter?: {
      _id?: string,
      uid?: string
    }
  }
  interface DeleteReturn {
    acknowledged: boolean,
    deletedCount: number
  }
  interface DeleteResult extends FetchResult {
    data: DeleteReturn
  }

  // 查询集合列表
  interface GetCollOption {
    dbname: string,
    filter?: any,
    options?: any,
  }

  interface UpLoadResult extends FetchResult {
    count: number;
  }


}