import React from 'react';
import {
  AlertDialog, AlertDialogBody, AlertDialogCloseButton, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Button, Card, CardBody, Flex, Grid, GridItem, Text,
  useDisclosure, useToast,
} from '@chakra-ui/react';


//---

const Config = {
  Bingo: {
    CardCols: 5, //to-do: with different Cols/Rows: adjust CardHeader header text size/position
    CardRows: 5,
    MaxNumber: 100,

    //CardFree

    CardHeader: 'BINGO',
    CellFree: 'FREE',

    Api: 'https://httpbin.org/post',
    StoreCard: 'BINGO_CARD',
    LogError: true,

    TestSVGText: true,
    TestLogResponse: true,

    //cardSize
  },
}

Config.Bingo.cardSize = Config.Bingo.CardCols * Config.Bingo.CardRows
Config.Bingo.CardFree = [0 | Config.Bingo.cardSize / 2]


//---

const NAME = 'John' //to-do

const Color = {
  Card: {
    bg: 'red.400', text: 'white',
  },
  Cell: {
    bg: 'white', text: 'red.400',
    textValidated: 'teal.500',
    schemeValidating: 'red',
  },
  Button: {
    schemeNew: 'red',
    schemeClear: 'red',
    schemeBingo: 'teal',
  },
}

const DefaultStateCell = {validating: false, validated: false}
const DefaultStateCard = Array.from(Array(Config.Bingo.cardSize))


//---

const Utils = {
  randomArrayNumber: (max, size, except = []) => {
    const nums = Array.from(Array(max)).map((_, idx) => idx)
    return Array.from(Array(size)).map((_, idx) => {
      if (except > -1 && except.includes(idx)) return undefined
      const num = 0 | Math.random() * nums.length
      return nums.splice(num, 1)[0]
    })
  },
}


//---

const BingoApi = {
  validateNumber: async function(number, last) {
    const request = {number, last, name: last ? NAME : undefined}

    try {
      const response = await fetch(Config.Bingo.Api, {
        method: 'POST',
        headers: {'Content-Type': 'application/json;charset=utf-8'},
        body: JSON.stringify(request)
      })
      let json = await response.json()
      if (Config.Bingo.TestLogResponse) console.log('response', json)
      return {response: JSON.parse(json.data)}
    } catch (ex) {
      if (Config.Bingo.LogError) console.error(ex)
      return {error: ex.message}
    }
  },
}


//---

const BingoStore = {
  get: () => localStorage.getItem(Config.Bingo.StoreCard),
  set: (card) => localStorage.setItem(Config.Bingo.StoreCard, JSON.stringify(card)),
  del: () => localStorage.removeItem(Config.Bingo.StoreCard),
}


//---

function BingoHeader() {
  /** @type ReactNode */
  const Header = Config.Bingo.CardHeader.split('')

  return Config.Bingo.TestSVGText
    ? <GridItem color={Color.Card.text} colSpan={Config.Bingo.CardCols} h='3.6em' mb='-1.1em' mt='-0.1em'>
      <svg width='100%' height='100%' viewBox='0.8 -8 31.7 9' preserveAspectRatio='none'>
        <text fontSize='10' fontWeight='bold' fill='white'>{Config.Bingo.CardHeader}</text>
      </svg>
    </GridItem>
    : <GridItem color='white' colSpan={Config.Bingo.CardCols} fontWeight='bold' fontSize='4em'>
      <Flex justify='space-between' ps='0.2em' pe='0.35em' mb='-0.7em' mt='-0.2em'>
        {Header.map((letter, idx) => <Text key={idx} sx={{transform: 'scale(2, 1)'}}>{letter}</Text>)}
      </Flex>
    </GridItem>
}


//---

function BingoCellButton({cell, onValidate, stateBusy}) {
  return (
    <Button h='100%' w='100%' fontSize='3em'
            onClick={!cell ? undefined : (ev) => onValidate(ev, cell.number)}
            isLoading={stateBusy || cell?.validating}
            colorScheme={!cell?.validating ? undefined : Color.Cell.schemeValidating}
            isDisabled={!cell || cell.validated}
            color={cell?.validated ? Color.Cell.textValidated : Color.Cell.text}
            style={{
              opacity: !cell?.validated ? undefined : 'unset',
              cursor: cell && !cell.validated ? undefined : 'default',
            }}>
      <Text fontSize='1em' mb='-0.25em'>{cell?.number ?? <>&nbsp;</>}</Text>
    </Button>)
}


//---

function BingoCard({stateBusy, stateCard, onValidate}) {
  return (
    <Card h='100%' bg={Color.Card.bg} borderRadius='20'>
      <CardBody>
        <Grid h='100%' gap={0.5} templateColumns={`repeat(${Config.Bingo.CardCols}, 1fr)`}
          //textAlign='center'
        >
          <BingoHeader/>

          {stateCard.map((cell, idx) => Config.Bingo.CardFree.includes(idx)
            ? <GridItem key={idx} bg={Color.Cell.bg}>
              <Flex h='100%' color={Color.Cell.text} justify='center' align='center' fontSize='1em'>{Config.Bingo.CellFree}</Flex>
            </GridItem>

            : <GridItem key={idx} bg={Color.Cell.bg}>
              <BingoCellButton cell={cell} onValidate={onValidate} stateBusy={stateBusy}/>
            </GridItem>)}
        </Grid>
      </CardBody>
    </Card>)
}


//---

function BingoConfirm({isOpen, onClose, stateConfirm, onOK}) {
  const refCancel = React.useRef()

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={refCancel} onClose={onClose} isCentered>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize='lg' fontWeight='bold'>
            {stateConfirm} Card
          </AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            Are you sure? You can't undo this action afterwards.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={refCancel} onClick={onClose}>Cancel</Button>
            <Button colorScheme='red' onClick={onOK} ml={3}>{stateConfirm}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>)
}
//---

const isPortrait = () => window.screen.orientation.type.startsWith('portrait')

function cardNew() {
  const card = Utils.randomArrayNumber(Config.Bingo.MaxNumber, Config.Bingo.cardSize, Config.Bingo.CardFree)
    .map(number => ({...DefaultStateCell, number}))
  BingoStore.set(card)
  return card
}

function cardLoad() {
  try {
    const data = BingoStore.get()
    if (!data) return
    const state = JSON.parse(data)
    if (!state.map) return
    return state.map(cell => ({...cell, validating: false}))
  } catch (ex) {
    if (Config.Bingo.LogError) console.error(ex)
  }
}

function useBingo() {
  const [statePortrait, setPortrait] = React.useState(isPortrait)

  React.useEffect(() => {
    const onOrientationChange = () => setPortrait(isPortrait())
    window.addEventListener('orientationchange', onOrientationChange)
    window.addEventListener("resize", onOrientationChange)
    return () => {
      window.removeEventListener('orientationchange', onOrientationChange)
      window.removeEventListener("resize", onOrientationChange)
    }
  }, [])


  //---

  const [stateBusy, setBusy] = React.useState(false)
  const [stateCard, setCard] = React.useState(() => cardLoad() ?? DefaultStateCard) //?? cardNew()
  const toast = useToast()

  async function onValidate(event, number) {
    setBusy(true)
    setCard(state => state.map(c => c.number !== number ? c : {...c, validating: true}))
    const last = stateCard.filter((c, idx) => !Config.Bingo.CardFree.includes(idx) && c.validated).length === Config.Bingo.cardSize - 2
    BingoApi.validateNumber(number, last).then(result => {
      setBusy(false)
      setCard(current => {
        const state = current.map(c => c.number !== number ? c : {...c, validating: false, validated: !result.error})
        BingoStore.set(JSON.stringify(state))
        return state
      })
      if (result.err) toast({
        title: 'Validation failed.',
        description: result.error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    })
  }


  //---

  const [stateConfirm, setConfirm] = React.useState('')
  const {isOpen, onOpen, onClose} = useDisclosure()

  const onNew = () => {
    setConfirm('New')
    onOpen()
  }

  const onClear = () => {
    setConfirm('Clear')
    onOpen()
  }

  const onOK = () => {
    if (stateConfirm === 'New')
      setCard(cardNew())
    else {
      BingoStore.del()
      setCard(DefaultStateCard)
    }
    onClose()
  }


  //---

  return {statePortrait, stateBusy, stateCard, onValidate, onNew, onClear,
    stateConfirm, isOpen, onClose, onOK}
}

export default function Bingo() {
  const {statePortrait, stateBusy, stateCard, onValidate, onNew, onClear,
    stateConfirm, isOpen, onClose, onOK} = useBingo()

  const onBingo = () => {} //to-do

  return <>
    <Flex direction='column' h='100vh' p='3' fontSize={statePortrait ? '2vmin' : '3vmin'} userSelect='none'>
      <BingoCard stateBusy={stateBusy} stateCard={stateCard} onValidate={onValidate}/>
      <Grid mt='2' gridTemplateColumns='1fr 1fr 1fr' gap='3'>
        <Button colorScheme={Color.Button.schemeNew} onClick={onNew} isDisabled={stateBusy}>New Card</Button>
        <Button colorScheme={Color.Button.schemeClear} onClick={onClear} isDisabled={stateBusy}>Clear</Button>
        <Button colorScheme={Color.Button.schemeBingo} onClick={onBingo} isDisabled={stateBusy}>Bingo</Button>
      </Grid>
    </Flex>

    <BingoConfirm stateConfirm={stateConfirm} isOpen={isOpen} onClose={onClose} onOK={onOK}/>
  </>
}
