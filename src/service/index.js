/**
 * Chat specific methods/functionality
 *
 * -- This is the business logic layer for chat --
 */
// import { ModuleConfig } from '../constants/';
import Application from '../constants/config';
import AppUtil from '../lib/util';

const MODULE = 'ChatService';
// use cases:
// 1) user sends a message:
//  (a) UI would send message to db
//  (b) this layer that observes DB changes would get the message
//  (c) queues the request to send to backend
// 2) user deletes a message:
//  (a) UI checks permission to delete - from this layer
//  (b) this layer co-ordinates with RC layer to check permissions
//  (c) UI deletes from db
//  (d) this layer observes db changes and would get the change
//  (e) queues the request

// NOTE: for timebeing this is by design a singleton class for both chat & service classes

class ChatService {
  constructor() {
    if (!ChatService._db && !ChatService._service) {
      ChatService._db = null;
      ChatService._service = null;
      ChatService._serverSettings = null;
      ChatService._loginSettings = [];
    }
  }

  // @todo - do any reinitializations here
  set db(dbHandle) {
    console.log('****** servicedb is set ********', dbHandle);
    ChatService._db = dbHandle;
  }
  get db() {
    return ChatService._db;
  }

  set service(backendService) {
    ChatService._service = backendService;
  }
  get service() {
    return ChatService._service;
  }
  set settings(s) {
    ChatService._serverSettings = s;
  }
  get settings() {
    return ChatService._serverSettings;
  }
  set loginSettings(ls) {
    ChatService._loginSettings = ls;
  }
  get loginSettings() {
    return ChatService._loginSettings;
  }
  getLoginSetting(key) {
    for (let i = 0; i < this.loginSettings.length; i += 1) {
      if (Object.prototype.hasOwnProperty.call(this.loginSettings[i], key)) {
        // @todo: sending just 'saml' is stupidity, need to send the whole array
        return this.loginSettings[i][key];
      }
    }
    return null;
  }

  // @todo - to remove the callback later
  // for timebeing using the same logic to
  // fetch the settings and return back cb
  connect(serverName, cb) {
    console.log('****** service connect to server  *****', serverName);
    this._reset();
    this.service.connect(serverName);
    this.service.getPublicSettings((err, settings) => {
      this.settings = settings;
      cb(err, settings);
    });
  }

  login(serverName, userName) {
    console.log('****** service login  *****', serverName, userName);
    this.db.setUserId(this.service.userId);
    Application.setUserId(this.service.userId);
    this.service.login(serverName, userName);
  }

  // ---- init section over, service methods follow ----

  // return available channels/groups to display
  get availableChannels() {
    return this.db.groups.filteredSortedList(Application.filterRooms);
  }

  // @todo: cache this lookup, no need to do db find every time ?
  get loggedInUserObj() {
    var user = this.loggedInUser;
    /*
      { _id: '6Qk76sozAy6oNSopT',
      emails: [ { address: 'emailID', verified: true } ],
      username: 'kumar',
      _version: 1 }
    */
    if (user) {
      return this.db.users.findById(user._id);
    }
    return null;
  }

  // @todo: move this method to lookup message as a db object (message)
  canDelete(message) {
    //    var deletePermission = false;
    var deleteOwn = false;
    const currentUsr = this.loggedInUserObj;
    if (currentUsr && message && message.u && message.u._id) {
      deleteOwn = (message.u._id === currentUsr._id);
    }
    //    deletePermission = this.deleteAllowed && deleteOwn;
    // if (this.blockDeleteInMinutes && this.blockDeleteInMinutes !== 0) {
    //   const msgTs = moment(message.ts);
    //   const currentTsDiff = moment().diff(msgTs, 'minutes');
    //   if (currentTsDiff > this.blockDeleteInMinutes) {
    //     return false;
    //   }
    // }
    return deleteOwn;
  }


  // ---- service actions -----

  // @todo: need to remove this from any reference in UI - lets use the above obj from db
  get loggedInUser() {
    return this.service.loggedInUser;
  }

  // Todo
  // - these can be disabled in UI and can be shown only
  //   only if connectivity present ? - TBD

  // Direct messages (DMs) are private, 1-on-1 conversation between team members. You can
  // think of a DM as a private group with only two members.
  createDirectMessage(userName, cb) {
    this.service.createDirectMessage(userName, cb);
  }
  createChannel(channelName, isReadonly, userList, cb) {
    this.service.createChannel(channelName, false, isReadonly, userList, cb);
  }
  createGroup(channelName, isReadonly, userList, cb) {
    this.service.createChannel(channelName, true, isReadonly, userList, cb);
  }
  joinRoom(roomId, cb) {
    this.service.joinRoom(roomId, cb);
  }

  // - presence
  setUserPresence(presenceStatus, cb) {
    this.service.setUserPresence(presenceStatus, (err, res) => {
      AppUtil.debug(res, `${MODULE}: setUserPresence - ${presenceStatus}`);
      if (cb) cb(err, res);
    });
  }
  getUserPresence(state, cb) {
    this.service.getUserPresence(state, (err, res) => {
      AppUtil.debug(res, `${MODULE}: getUserPresence - ${state}`);
      if (cb) cb(err, res);
    });
  }

  // - reactions
  setLike(messageId, cb) {
    this.service.setLikeReaction(messageId, cb);
  }

  // - conference calls
  startVideoConference(rid) {
    this.service.startVideoConference(rid);
  }

  // -- internal service call backs

  _reset() {
    this.settings = null;
    this.loginSettings = [];
  }

  // @todo: convert this to a single call in db (batch txn update)
  _updateUsers(users) {
    // console.log("**** update users **** ====> ", this.db);
    // console.log("**** update users **** ====> ", this.db && this.db.users && this.db.users.list);
    if (users && users.length > 0) {
      for (let i = 0; i < users.length; i += 1) {
        this.db.users.updateFullUserData(users[i]);
      }
    }
  }
  _deleteGroups(groups) {
    this.db.groups.deleteGroups(groups);
  }
  _updateGroups(groups) {
    this.db.groups.addAll(groups);
  }
  _updateLoginConfig(loginDetails) {
    this.loginSettings = this.loginSettings.concat(loginDetails);
  }
}

/* Export ==================================================================== */
export default ChatService;
