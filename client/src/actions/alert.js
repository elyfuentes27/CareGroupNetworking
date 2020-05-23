import uuid from 'uuid';
import { SET_ALERT, REMOVE_ALERT } from './types';

// we can do another arrow function after dispatch because of the thunk middleware
export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
  const id = uuid.v4();
  dispatch({
    type: SET_ALERT,
    payload: { msg, alertType, id }
  });

  setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
};
