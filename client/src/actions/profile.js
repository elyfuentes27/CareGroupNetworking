import axios from 'axios';
import { setAlert } from './alert';

import { GET_PROFILE, PROFILE_ERROR } from './types';

// Will get current users profile
export const getCurrentProfile = () => async dispatch => {
  try {
    const res = await axios.get('/api/profile/me');
    console.log('profileeee');
    dispatch({
      type: GET_PROFILE,
      payload: res.data
    });
  } catch (err) {
    console.log('NOOOOOO', err);
    dispatch({
      type: PROFILE_ERROR,
      payload: { mssg: err.response.status.text, status: err.response.status }
    });
  }
};
