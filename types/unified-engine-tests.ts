import * as engine from 'unified-engine'
import * as remark from 'remark'

engine(
  {
    processor: remark()
  },
  () => {}
)

engine(
  {
    processor: remark(),
    settings: {gfm: true}
  },
  () => {}
)

engine(
  {
    processor: remark(),
    // $ExpectError
    settings: {notARealSetting: true}
  },
  () => {}
)
