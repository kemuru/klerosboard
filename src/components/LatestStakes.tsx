import React from 'react'
import { Box, Typography } from '@mui/material';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { shortenAddress } from '@usedapp/core';
import { BigNumberish } from 'ethers';
import { Juror } from '../graphql/subgraph';
import { useStakes } from '../hooks/useStakes';
import CourtLink from './CourtLink';
import { Link as LinkRouter } from 'react-router-dom';
import { Link } from '@mui/material';
import { formatPNK } from '../lib/helpers';


interface Props {
    chainId: string
    courtId?: string
}

export default function LatestStakes(props: Props) {
    const { data: stakes, isLoading: stakes_loading } = useStakes(props.chainId);
    const columns_stakes = [
        {
          field: 'address', headerName: 'Juror', flex: 1, renderCell: (params: GridRenderCellParams<Juror>) => (
            <Link component={LinkRouter} to={'/profile/' + params.value!.id} children={shortenAddress(params.value!.id)} />
          )
        },
        {
          field: 'subcourtID', headerName: 'Court Name', flex: 2, renderCell: (params: GridRenderCellParams<BigNumberish>) => (
            <CourtLink chainId={props.chainId} courtId={params.value! as string} />
          )
        },
        {
          field: 'stake', headerName: 'Last Stake', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
            return formatPNK(params.value);
          }
        },
      ];

    return (
        <Box>

            <Typography sx={{ fontSize: '24px', fontWeight: 600, fontStyle: 'normal' }}>Latest Stakes</Typography>
            {<DataGrid
                sx={{ marginTop: '30px' }}
                rows={stakes ? stakes! : []}
                columns={columns_stakes}
                loading={stakes_loading}
                pageSize={10}
                disableSelectionOnClick
                autoHeight={true}
                hideFooter={true}
            />}
        </Box>

    )
}
