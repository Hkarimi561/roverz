/*
 * User Manager class
 */
import AppUtil from '../../lib/util';
import Constants from '../constants';

// wrapper class for all user related db functions
export default class CardManager {
  constructor(realm) {
    this._realm = realm;
  }

  get list() {
    return this._realm.objects(Constants.Card);
  }

    // find user by id
  findById(cid) {
    const res = this.list.filtered(`_id = "${cid}"`);
    return (res && res.length > 0) ? res['0'] : null;
  }


  findByBoardIdAsList(bid) {
    const res = this.list.filtered(`boardId = "${bid}"`);
    return (res && res.length > 0) ? res : null;
  }

  addAll(cardList) {
    if (!cardList || Object.keys(cardList).length <= 0) return;
    AppUtil.debug(null, `${Constants.MODULE}: addAll`);
    this._realm.write(() => {
      Object.keys(cardList).forEach((k) => {
        var obj = cardList[k];
        obj = AppUtil.removeEmptyValues(obj);
        if (obj._id) {
          const objToStore = {
            _id: obj._id,
            title: obj.title,
            userId: obj.userId,
            boardId: obj.boardId,
            sort: obj.sort,
            archived: obj.archived,
            isOvertime: obj.isOvertime,
            createdAt: obj.createdAt,
            dateLastActivity: obj.dateLastActivity,
          };
          AppUtil.debug(objToStore, null);
          console.log('Ezhil cardmanager ', objToStore);
          this._realm.create(Constants.Card, objToStore, true);
        }
      });
    });
  }


}
