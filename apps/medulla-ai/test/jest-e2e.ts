import { Config } from 'jest';
require('dotenv').config()

let medulla_common_mapper_root = process.env.MEDULLA_COMMON_DEV_ROOT

switch (process.env.NODE_ENV) {
	case "staging":
		medulla_common_mapper_root = process.env.MEDULLA_COMMON_STAGING_ROOT
		break;

	default:
		break;
}

const config: Config = {
	"moduleFileExtensions": ["js", "json", "ts"],
	"rootDir": ".",
	"testEnvironment": "node",
	"testRegex": ".e2e-spec.ts$",
	"transform": {
		"^.+\\.(t|j)s$": "ts-jest"
	},
	"moduleNameMapper": {
		"^@app/medulla-common(.*)$": medulla_common_mapper_root + "/libs/medulla-common/src$1"
	}
}

export default config
