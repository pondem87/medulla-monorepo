import { Config } from 'jest';

let medulla_common_mapper = "/home/medulla/libs/medulla-common/src$1"

switch (process.env.NODE_ENV) {
	case "staging":
		medulla_common_mapper = "/home/runner/work/medulla-monorepo/medulla-monorepo/libs/medulla-common/src$1"
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
		"^@app/medulla-common(.*)$": medulla_common_mapper
	}
}

export default config