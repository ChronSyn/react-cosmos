import * as React from 'react';
import retry from '@skidding/async-retry';
import { StateMock } from '@react-mock/state';
import {
  createValues,
  updateFixtureStateClassState
} from 'react-cosmos-shared2/fixtureState';
import { uuid } from 'react-cosmos-shared2/util';
import { Counter } from '../testHelpers/components';
import {
  anyProps,
  anyClassState,
  getClassState
} from '../testHelpers/fixtureState';
import { runFixtureConnectTests } from '../testHelpers';

const rendererId = uuid();
const fixtures = {
  first: (
    <>
      <StateMock state={{ count: 5 }}>
        <Counter />
      </StateMock>
      <StateMock state={{ count: 10 }}>
        <Counter />
      </StateMock>
    </>
  )
};
const decorators = {};
const fixtureId = { path: 'first', name: null };

runFixtureConnectTests(mount => {
  it('captures mocked state from multiple instances', async () => {
    await mount(
      { rendererId, fixtures, decorators },
      async ({ selectFixture, fixtureStateChange }) => {
        await selectFixture({
          rendererId,
          fixtureId,
          fixtureState: {}
        });
        await fixtureStateChange({
          rendererId,
          fixtureId,
          fixtureState: {
            props: [anyProps(), anyProps()],
            classState: [
              anyClassState({
                values: createValues({ count: 5 })
              }),
              anyClassState({
                values: createValues({ count: 10 })
              })
            ]
          }
        });
      }
    );
  });

  it('overwrites mocked state in second instances', async () => {
    await mount(
      { rendererId, fixtures, decorators },
      async ({
        renderer,
        selectFixture,
        setFixtureState,
        getLastFixtureState
      }) => {
        await selectFixture({
          rendererId,
          fixtureId,
          fixtureState: {}
        });
        const fixtureState = await getLastFixtureState();
        const [, { elementId }] = getClassState(fixtureState, 2);
        await setFixtureState({
          rendererId,
          fixtureId,
          fixtureState: {
            classState: updateFixtureStateClassState({
              fixtureState,
              elementId,
              values: createValues({ count: 100 })
            })
          }
        });
        await retry(() =>
          expect(renderer.toJSON()).toEqual(['5 times', '100 times'])
        );
      }
    );
  });
});
