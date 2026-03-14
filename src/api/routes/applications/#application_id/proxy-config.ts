/*
    Spacebar: A FOSS re-implementation and extension of the Discord.com backend.
    Copyright (C) 2023 Spacebar and Spacebar Contributors
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ProxyConfigSchema } from "@spacebar/schemas";
import { route } from "@spacebar/api";
import { Request, Response, Router } from "express";
import { Application, ApplicationCommand, FieldErrors, Snowflake } from "@spacebar/util";
import { IsNull } from "typeorm";

const router = Router({ mergeParams: true });

router.get("/", route({}), async (req: Request, res: Response) => {
    const applicationExists = await Application.exists({ where: { id: req.params.application_id as string } });

    if (!applicationExists) {
        res.status(404).send({ code: 404, message: "Unknown application" });
        return;
    }

    const App = await Application.findOneOrFail({ where: { id: req.params.application_id as string } });
    const ProxyData = App.proxy_config? App.proxy_config : {url_map: []} as ProxyConfigSchema
    res.send(ProxyData);
});

router.post(
    "/",
    route({
        requestBody: "ProxyConfigSchema",
    }),
    async (req: Request, res: Response) => {
        const applicationExists = await Application.exists({ where: { id: req.params.application_id as string } });

        if (!applicationExists) {
            res.status(404).send({ code: 404, message: "Unknown application" });
            return;
        }

        const body = req.body as ProxyConfigSchema;
        const maps = body.url_map

        maps.forEach( (value) => {
            if (value.prefix.trim().length < 1 || value.prefix.trim().length > 32) {
            // TODO: configurable?
            throw FieldErrors({
                name: {
                    code: "BASE_TYPE_BAD_LENGTH",
                    message: `Must be between 1 and 32 in length.`,
                },
            });
        }
        })

        

        const dataForDb: ProxyConfigSchema = body

        await Application.update({ id: req.params.application_id as string }, { proxy_config: dataForDb });

        res.send(body);
    },
);

export default router;
