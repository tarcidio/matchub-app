import { Observable, BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ChampionDetails } from '../dto/champion/champion-details/champion-details';
import { Injectable } from '@angular/core';
import { HubUserDetails } from '../dto/hub-user/hub-user-details/hub-user-details';

// Obs: it isn't necessary use spotlightName, because each screen is independence
export interface State {
    hubUser: HubUserDetails | undefined,
    champions: ChampionDetails[] | undefined
}

const state: State = {
    hubUser : undefined,
    champions: undefined
};

@Injectable({
  providedIn: 'root',
})
export class Store {
  private subject = new BehaviorSubject<State>(state);
  private store = this.subject.asObservable().pipe(distinctUntilChanged());

  // Retorn current state
  get value() {
    return this.subject.value;
  }

  // Returns an Observable of the current state, but only the part that is of interest
  select<T>(name: keyof State): Observable<T> {
    return this.store.pipe(
        map(state => state[name] as T)
      );
  }

  // Changes part of the state
  set(name: string, state: any) {
    this.subject.next({ ...this.value, [name]: state });
  }
}
