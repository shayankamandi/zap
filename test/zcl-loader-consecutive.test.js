/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *
 *
 * @jest-environment node
 */

const dbApi = require('../src-electron/db/db-api')
const dbEnum = require('../src-shared/db-enum')
const queryZcl = require('../src-electron/db/query-zcl')
const queryCommand = require('../src-electron/db/query-command')
const queryPackage = require('../src-electron/db/query-package')
const zclLoader = require('../src-electron/zcl/zcl-loader')
const env = require('../src-electron/util/env')
const testUtil = require('./test-util')
const testQuery = require('./test-query')

beforeAll(async () => {
  env.setDevelopmentEnv()
})

test(
  'that that parallel loading of zcl and dotdot and matter is possible',
  async () => {
    let db = await dbApi.initRamDatabase()
    await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())

    let promises = []
    promises.push(zclLoader.loadZcl(db, env.builtinSilabsZclMetafile()))
    promises.push(zclLoader.loadZcl(db, env.builtinDotdotZclMetafile()))

    await Promise.all(promises)

    await dbApi.closeDatabase(db)
  },
  testUtil.timeout.long()
)

test(
  'test that consecutive loading of metafiles properly avoids duplication',
  async () => {
    let db = await dbApi.initRamDatabase()
    try {
      await dbApi.loadSchema(db, env.schemaFile(), env.zapVersion())

      let dotdotPackageId
      let ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      let jsonPackageId = ctx.packageId

      ctx = await zclLoader.loadZcl(db, env.builtinSilabsZclMetafile())
      expect(ctx.packageId).toEqual(jsonPackageId)
      let p = await queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
      expect(p.version).toEqual('ZCL Test Data')
      await zclLoader.loadZcl(db, env.builtinDotdotZclMetafile())
      ctx = await zclLoader.loadZcl(db, env.builtinDotdotZclMetafile())
      dotdotPackageId = ctx.packageId
      expect(dotdotPackageId).not.toEqual(jsonPackageId)
      p = await queryPackage.getPackageByPackageId(ctx.db, ctx.packageId)
      expect(p.version).toEqual('1.0')

      let rows = await queryPackage.getPackagesByType(
        db,
        dbEnum.packageType.zclProperties
      )
      expect(rows.length).toEqual(2)
      let x = await queryZcl.selectAllClusters(db, jsonPackageId)
      expect(x.length).toEqual(testUtil.totalClusterCount)
      x = await queryCommand.selectAllClusterCommands(db, jsonPackageId)

      let unmatchedRequestCount = 0
      let responsesCount = 0
      let totalCount = 0
      for (cmd of x) {
        totalCount++
        if (cmd.responseRef != null) {
          responsesCount++
        }
        if (cmd.name.endsWith('Request') && cmd.responseRef == null) {
          unmatchedRequestCount++
        }
      }
      expect(totalCount).toBeGreaterThan(0)
      // This is how many commands are linked to their responses
      expect(responsesCount).toBe(1)
      // This seems to be the unmatched number in our XML files.
      expect(unmatchedRequestCount).toBe(46)
      expect(x.length).toBe(testUtil.totalClusterCommandCount)
      let z = await queryCommand.selectCommandById(db, x[0].id)
      expect(z.label).toBe(x[0].label)

      x = await queryCommand.selectAllCommandArguments(db, jsonPackageId)
      expect(x.length).toEqual(testUtil.totalCommandArgsCount)

      x = await queryZcl.selectAllDomains(db, jsonPackageId)
      expect(x.length).toEqual(testUtil.totalDomainCount)

      z = await queryZcl.selectDomainById(db, x[0].id)
      expect(z.label).toBe(x[0].label)

      x = await queryZcl.selectAllEnums(db, jsonPackageId)
      expect(x.length).toEqual(testUtil.totalEnumCount)

      x = await queryZcl.selectAllAttributesBySide(db, 'server', jsonPackageId)
      expect(x.length).toBe(testUtil.totalServerAttributeCount)

      x = await queryZcl.selectAllEnumItems(db, jsonPackageId)
      expect(x.length).toEqual(testUtil.totalEnumItemCount)

      x = await queryZcl.selectAllStructsWithItemCount(db, jsonPackageId)
      expect(x.length).toEqual(54)

      x = await queryZcl.selectAllBitmaps(db, jsonPackageId)
      expect(x.length).toEqual(121)

      x = await queryZcl.selectAllDeviceTypes(db, jsonPackageId)

      expect(x.length).toEqual(175)

      x = await queryZcl.selectAllAtomics(db, jsonPackageId)
      expect(x.length).toEqual(56)

      x = await queryZcl.selectAllClusters(db, dotdotPackageId)
      expect(x.length).toEqual(41)

      x = await queryCommand.selectAllClusterCommands(db, dotdotPackageId)
      expect(x.length).toBe(215)

      x = await queryCommand.selectAllCommandArguments(db, dotdotPackageId)
      expect(x.length).toEqual(644)

      x = await queryZcl.selectAllDeviceTypes(db, dotdotPackageId)
      expect(x.length).toEqual(108)

      x = await queryZcl.selectAllBitmaps(db, dotdotPackageId)
      expect(x.length).toEqual(61)

      x = await queryZcl.selectAllEnums(db, dotdotPackageId)
      expect(x.length).toEqual(testUtil.totalDotDotEnums)

      x = await queryZcl.selectAllAttributesBySide(
        db,
        'server',
        dotdotPackageId
      )
      expect(x.length).toBe(615)

      x = await queryZcl.selectAllEnumItems(db, dotdotPackageId)
      expect(x.length).toEqual(testUtil.totalDotDotEnumItems)

      x = await queryZcl.selectAllStructsWithItemCount(db, dotdotPackageId)
      expect(x.length).toEqual(20)

      x = await queryZcl.selectAllAtomics(db, dotdotPackageId)
      expect(x.length).toEqual(56)

      x = await dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM CLUSTER WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
      expect(x.length).toEqual(5)

      x = await dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM COMMAND WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
      expect(x.length).toEqual(58)

      x = await dbApi.dbAll(
        db,
        'SELECT MANUFACTURER_CODE FROM ATTRIBUTE WHERE MANUFACTURER_CODE NOT NULL',
        []
      )
      expect(x.length).toEqual(30)

      rows = await dbApi.dbMultiSelect(
        db,
        'SELECT CLUSTER_ID FROM CLUSTER WHERE CODE = ?',
        [[0], [6]]
      )
      expect(rows.length).toBe(2)
      expect(rows[0]).not.toBeUndefined()
      expect(rows[1]).not.toBeUndefined()
      expect(rows[0].CLUSTER_ID).not.toBeUndefined()
      expect(rows[1].CLUSTER_ID).not.toBeUndefined()

      rows = await queryPackage.selectAllOptionsValues(
        db,
        jsonPackageId,
        dbEnum.sessionOption.defaultResponsePolicy
      )
      expect(rows.length).toBe(3)

      await dbApi.dbAll(
        db,
        'SELECT NAME, TYPE, PACKAGE_REF FROM BITMAP WHERE NAME IN (SELECT NAME FROM BITMAP GROUP BY NAME HAVING COUNT(*)>1)',
        []
      )
      await dbApi.dbAll(
        db,
        'SELECT NAME, TYPE, PACKAGE_REF FROM ENUM WHERE NAME IN (SELECT NAME FROM ENUM GROUP BY NAME HAVING COUNT(*)>1)',
        []
      )
    } finally {
      dbApi.closeDatabase(db)
    }
  },
  testUtil.timeout.long()
)
