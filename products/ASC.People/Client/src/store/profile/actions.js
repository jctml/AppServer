import * as api from "../../store/services/api";
import { isMe } from '../auth/selectors';
import { getUserByUserName } from '../people/selectors';
import { fetchPeople } from "../people/actions";
import { setCurrentUser } from "../auth/actions";

export const SET_PROFILE = 'SET_PROFILE';
export const CLEAN_PROFILE = 'CLEAN_PROFILE';

export function setProfile(targetUser) {
    return {
        type: SET_PROFILE,
        targetUser
    };
};

export function resetProfile() {
    return {
        type: CLEAN_PROFILE
    };
};

export function employeeWrapperToMemberModel(profile) {
    const comment = profile.notes;
    const department = profile.groups ? profile.groups.map(group => group.id) : [];
    const worksFrom = profile.workFrom;

    return { ...profile, comment, department, worksFrom };
};

export function fetchProfile(userName) {
    return (dispatch, getState) => {
        const { auth, people } = getState();

        if (isMe(auth.user, userName)) {
            dispatch(setProfile(auth.user));
        } else {
            const user = getUserByUserName(people.users, userName);
            if (!user) {
                api.getUser(userName).then(user => {
                    dispatch(setProfile(user));
                });
            } else {
                dispatch(setProfile(user));
            }
        }
    };
};

export function createProfile(profile) {
    return (dispatch, getState) => {
        const { people } = getState();
        const { filter } = people;
        const member = employeeWrapperToMemberModel(profile);
        let result;

        return api.createUser(member).then(user => {
            result = user;
            return dispatch(setProfile(user));
        }).then(() => {
            return fetchPeople(filter, dispatch);
        }).then(() => {
            return Promise.resolve(result);
        });
    };
};

export function updateProfile(profile) {
    return (dispatch, getState) => {
        const { people } = getState();
        const { filter } = people;
        const member = employeeWrapperToMemberModel(profile);
        let result;

        return api.updateUser(member).then(user => {
            result = user;
            return Promise.resolve(dispatch(setProfile(user)));
        }).then(() => {
            return fetchPeople(filter, dispatch);
        }).then(() => {
            return Promise.resolve(result);
        });
    };
};

export function updateProfileCulture(id, culture) {
    return (dispatch) => {
        return api.updateUserCulture(id, culture).then(user => {
            dispatch(setCurrentUser(user));
            return dispatch(setProfile(user));
        });
    };
};

export function getInvitationLink(isGuest = false) {
    return dispatch => {
        return api.getInvitationLink(isGuest);
    }
};
