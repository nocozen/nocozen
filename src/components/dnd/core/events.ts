export class DnDEvent {
    type: any;
    data: any;
    top: any;
    previousTop: any;
    source: any;
    position: any;
    success: any;
    native: any;
}

export class ReorderEvent {
    from;
    to;
    
    constructor (from: any, to: any) {
      this.from = from;
      this.to = to;
    }

    apply (array: any) {
      const temp = array[this.from];
      array.splice(this.from, 1);
      array.splice(this.to, 0, temp);
    }

}

export class InsertEvent {
    type;
    data;
    index;
    
    constructor (type: any, data: any, index: any) {
      this.type = type;
      this.data = data;
      this.index = index;
    }
}
